import { randomUUID } from "node:crypto";
import { prisma } from "../../data/prisma.js";
import { generateId, hashString } from "../../lib/auth.js";
function createKeyMaterial(type) {
    const prefix = type === "secret" ? "gc_live" : "gc_pub";
    const plaintextKey = `${prefix}_${randomUUID().replace(/-/g, "")}`;
    return {
        plaintextKey,
        prefix: plaintextKey.slice(0, 16),
        keyHash: hashString(plaintextKey)
    };
}
function parseScopes(scopesJson) {
    return JSON.parse(scopesJson);
}
function toPublicKey(key) {
    return {
        id: key.id,
        workspaceId: key.workspaceId,
        name: key.name,
        prefix: key.prefix,
        type: key.type,
        status: key.status,
        scopes: parseScopes(key.scopesJson),
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
        lastUsedAt: key.lastUsedAt,
        expiresAt: key.expiresAt,
        revokedAt: key.revokedAt,
        deletedAt: key.deletedAt,
        usageCount: key.usageCount,
        secretPreview: null
    };
}
export async function listApiKeys(workspaceId) {
    const keys = await prisma.apiKey.findMany({ where: { workspaceId, deletedAt: null }, orderBy: { createdAt: "desc" } });
    return { items: keys.map(toPublicKey), total: keys.length };
}
export async function createApiKey(input) {
    const material = createKeyMaterial(input.type);
    const now = new Date();
    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    const created = await prisma.apiKey.create({
        data: {
            id: generateId("key"),
            workspaceId: input.workspaceId,
            name: input.name,
            prefix: material.prefix,
            keyHash: material.keyHash,
            type: input.type,
            status: "active",
            scopesJson: JSON.stringify(input.scopes),
            expiresAt,
            createdById: input.actorId,
            updatedById: input.actorId,
            createdAt: now,
            updatedAt: now
        }
    });
    await prisma.auditLog.create({
        data: {
            id: generateId("audit"),
            workspaceId: input.workspaceId,
            actorId: input.actorId,
            action: "api_key.created",
            entityType: "ApiKey",
            entityId: created.id,
            metadataJson: JSON.stringify({ name: input.name, type: input.type, scopes: input.scopes, expiresAt })
        }
    });
    return { apiKey: toPublicKey(created), plaintextKey: material.plaintextKey };
}
export async function rotateApiKey(input) {
    const existing = await prisma.apiKey.findFirst({ where: { id: input.apiKeyId, workspaceId: input.workspaceId, deletedAt: null } });
    if (!existing)
        throw new Error("API key not found");
    const material = createKeyMaterial(existing.type);
    const updated = await prisma.apiKey.update({
        where: { id: existing.id },
        data: {
            prefix: material.prefix,
            keyHash: material.keyHash,
            status: "active",
            updatedById: input.actorId,
            updatedAt: new Date()
        }
    });
    await prisma.auditLog.create({
        data: {
            id: generateId("audit"),
            workspaceId: input.workspaceId,
            actorId: input.actorId,
            action: "api_key.rotated",
            entityType: "ApiKey",
            entityId: updated.id,
            metadataJson: JSON.stringify({ prefix: updated.prefix })
        }
    });
    return { apiKey: toPublicKey(updated), plaintextKey: material.plaintextKey };
}
export async function revokeApiKey(input) {
    const updated = await prisma.apiKey.updateMany({
        where: { id: input.apiKeyId, workspaceId: input.workspaceId, deletedAt: null },
        data: { status: "revoked", revokedAt: new Date(), revokedReason: input.reason ?? null, updatedById: input.actorId, updatedAt: new Date() }
    });
    if (updated.count === 0)
        throw new Error("API key not found");
    const key = await prisma.apiKey.findUnique({ where: { id: input.apiKeyId } });
    if (key) {
        await prisma.auditLog.create({
            data: {
                id: generateId("audit"),
                workspaceId: input.workspaceId,
                actorId: input.actorId,
                action: "api_key.revoked",
                entityType: "ApiKey",
                entityId: key.id,
                metadataJson: JSON.stringify({ reason: input.reason ?? null })
            }
        });
        return toPublicKey(key);
    }
    return null;
}
export async function deleteApiKey(input) {
    const key = await prisma.apiKey.findFirst({ where: { id: input.apiKeyId, workspaceId: input.workspaceId, deletedAt: null } });
    if (!key)
        throw new Error("API key not found");
    const deleted = await prisma.apiKey.update({
        where: { id: key.id },
        data: { status: "deleted", deletedAt: new Date(), updatedById: input.actorId, updatedAt: new Date() }
    });
    await prisma.auditLog.create({
        data: {
            id: generateId("audit"),
            workspaceId: input.workspaceId,
            actorId: input.actorId,
            action: "api_key.deleted",
            entityType: "ApiKey",
            entityId: deleted.id,
            metadataJson: JSON.stringify({ name: deleted.name })
        }
    });
    return toPublicKey(deleted);
}
export async function trackApiKeyUsage(input) {
    await prisma.apiKey.update({
        where: { id: input.apiKeyId },
        data: { lastUsedAt: new Date(), usageCount: { increment: 1 }, updatedAt: new Date() }
    });
    await prisma.apiKeyUsage.create({
        data: {
            id: generateId("aku"),
            apiKeyId: input.apiKeyId,
            path: input.path,
            method: input.method,
            statusCode: input.statusCode,
            responseTimeMs: input.responseTimeMs,
            ipAddress: input.ipAddress ?? null,
            userAgent: input.userAgent ?? null
        }
    });
}
export async function authenticateApiKey(authorizationHeader) {
    if (!authorizationHeader?.startsWith("Bearer "))
        return null;
    const provided = authorizationHeader.slice("Bearer ".length).trim();
    if (!provided)
        return null;
    const keyHash = hashString(provided);
    const prefix = provided.slice(0, 16);
    const key = await prisma.apiKey.findFirst({
        where: { prefix, keyHash, status: "active", deletedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }
    });
    if (!key)
        return null;
    return { apiKey: toPublicKey(key), plaintextKey: provided };
}
export async function getApiKeyUsage(workspaceId, apiKeyId) {
    const usage = await prisma.apiKeyUsage.findMany({
        where: { apiKey: { workspaceId, deletedAt: null, ...(apiKeyId ? { id: apiKeyId } : {}) } },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { apiKey: true }
    });
    const keys = await prisma.apiKey.findMany({ where: { workspaceId, deletedAt: null, ...(apiKeyId ? { id: apiKeyId } : {}) }, orderBy: { createdAt: "desc" } });
    return {
        keys: keys.map(toPublicKey),
        usage: usage.map((entry) => ({
            id: entry.id,
            apiKeyId: entry.apiKeyId,
            apiKeyName: entry.apiKey.name,
            prefix: entry.apiKey.prefix,
            path: entry.path,
            method: entry.method,
            statusCode: entry.statusCode,
            responseTimeMs: entry.responseTimeMs,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            createdAt: entry.createdAt
        }))
    };
}
