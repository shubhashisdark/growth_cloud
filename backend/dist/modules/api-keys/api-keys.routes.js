import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../data/prisma.js";
import { generateId } from "../../lib/auth.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { authenticateApiKey, createApiKey, deleteApiKey, getApiKeyUsage, listApiKeys, revokeApiKey, rotateApiKey, trackApiKeyUsage } from "./api-key.service.js";
const scopeValues = [
    "auth:read",
    "workspaces:read",
    "workspaces:write",
    "users:write",
    "events:write",
    "identify:write",
    "api_keys:read",
    "api_keys:write",
    "api_usage:read"
];
const createApiKeySchema = z.object({
    workspaceId: z.string().min(1).optional(),
    actorId: z.string().min(1).optional(),
    name: z.string().min(2),
    type: z.enum(["public", "secret"]),
    scopes: z.array(z.enum(scopeValues)).min(1),
    expiresAt: z.string().datetime().nullable().optional()
});
const mutateApiKeySchema = z.object({
    workspaceId: z.string().min(1).optional(),
    actorId: z.string().min(1).optional(),
    reason: z.string().min(1).nullable().optional()
});
const usageTrackSchema = z.object({
    path: z.string().min(1),
    method: z.string().min(3),
    statusCode: z.number().int(),
    responseTimeMs: z.number().int().nonnegative(),
    ipAddress: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional()
});
function jsonSuccess(response, data, status = 200) {
    return response.status(status).json({ data, meta: { timestamp: new Date().toISOString() }, error: null });
}
function jsonError(response, status, code, message) {
    return response.status(status).json({ data: null, meta: { timestamp: new Date().toISOString() }, error: { code, message } });
}
function getParam(param) {
    if (Array.isArray(param))
        return param[0] || "";
    return param || "";
}
async function resolveContext(request, bodyWorkspaceId, bodyActorId) {
    const actorId = bodyActorId || request.actor?.userId;
    const workspaceId = bodyWorkspaceId || request.query?.workspaceId || request.headers?.["x-workspace-id"];
    if (!actorId)
        return { error: "UNAUTHORIZED", message: "Authentication is required", status: 401 };
    if (!workspaceId)
        return { error: "WORKSPACE_ID_REQUIRED", message: "workspaceId is required", status: 400 };
    const membership = await prisma.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId: actorId } } });
    if (!membership)
        return { error: "FORBIDDEN", message: "Not a member of target workspace", status: 403 };
    return { actorId, workspaceId, role: membership.role };
}
function canManageApiKeys(role) {
    return ["super_admin", "admin", "developer"].includes(role);
}
export const apiKeysRouter = Router();
// Endpoint: Authenticate API Key directly
apiKeysRouter.post("/authenticate", async (request, response) => {
    const authenticated = await authenticateApiKey(request.headers.authorization);
    if (!authenticated)
        return jsonError(response, 401, "UNAUTHORIZED", "Invalid or expired API key");
    return jsonSuccess(response, { apiKey: authenticated.apiKey, scopes: authenticated.apiKey.scopes, authenticated: true });
});
// Endpoint: List API Keys
apiKeysRouter.get("/", requireAuth, async (request, response) => {
    const ctx = await resolveContext(request);
    if ("error" in ctx)
        return jsonError(response, ctx.status, ctx.error, ctx.message);
    const result = await listApiKeys(ctx.workspaceId);
    return jsonSuccess(response, result);
});
// Endpoint: View API Usage Telemetry
apiKeysRouter.get("/usage", requireAuth, async (request, response) => {
    const ctx = await resolveContext(request);
    if ("error" in ctx)
        return jsonError(response, ctx.status, ctx.error, ctx.message);
    const apiKeyId = request.query.apiKeyId?.toString();
    const result = await getApiKeyUsage(ctx.workspaceId, apiKeyId);
    return jsonSuccess(response, result);
});
// Endpoint: Create API Key
apiKeysRouter.post("/", requireAuth, async (request, response) => {
    const payload = createApiKeySchema.parse(request.body);
    const ctx = await resolveContext(request, payload.workspaceId, payload.actorId);
    if ("error" in ctx)
        return jsonError(response, ctx.status, ctx.error, ctx.message);
    if (!canManageApiKeys(ctx.role))
        return jsonError(response, 403, "FORBIDDEN", "Insufficient permissions to manage API keys");
    const created = await createApiKey({
        workspaceId: ctx.workspaceId,
        actorId: ctx.actorId,
        name: payload.name,
        type: payload.type,
        scopes: payload.scopes,
        expiresAt: payload.expiresAt
    });
    return jsonSuccess(response, created, 201);
});
// Endpoint: Rotate API Key
apiKeysRouter.post("/:apiKeyId/rotate", requireAuth, async (request, response) => {
    const payload = mutateApiKeySchema.parse(request.body);
    const ctx = await resolveContext(request, payload.workspaceId, payload.actorId);
    if ("error" in ctx)
        return jsonError(response, ctx.status, ctx.error, ctx.message);
    if (!canManageApiKeys(ctx.role))
        return jsonError(response, 403, "FORBIDDEN", "Insufficient permissions to manage API keys");
    const apiKeyId = getParam(request.params.apiKeyId);
    const rotated = await rotateApiKey({ workspaceId: ctx.workspaceId, actorId: ctx.actorId, apiKeyId });
    return jsonSuccess(response, rotated);
});
// Endpoint: Revoke API Key
apiKeysRouter.post("/:apiKeyId/revoke", requireAuth, async (request, response) => {
    const payload = mutateApiKeySchema.parse(request.body);
    const ctx = await resolveContext(request, payload.workspaceId, payload.actorId);
    if ("error" in ctx)
        return jsonError(response, ctx.status, ctx.error, ctx.message);
    if (!canManageApiKeys(ctx.role))
        return jsonError(response, 403, "FORBIDDEN", "Insufficient permissions to manage API keys");
    const apiKeyId = getParam(request.params.apiKeyId);
    const revoked = await revokeApiKey({ workspaceId: ctx.workspaceId, actorId: ctx.actorId, apiKeyId, reason: payload.reason ?? null });
    return jsonSuccess(response, revoked);
});
// Endpoint: Delete API Key
apiKeysRouter.delete("/:apiKeyId", requireAuth, async (request, response) => {
    const payload = mutateApiKeySchema.parse(request.body);
    const ctx = await resolveContext(request, payload.workspaceId, payload.actorId);
    if ("error" in ctx)
        return jsonError(response, ctx.status, ctx.error, ctx.message);
    if (!canManageApiKeys(ctx.role))
        return jsonError(response, 403, "FORBIDDEN", "Insufficient permissions to manage API keys");
    const apiKeyId = getParam(request.params.apiKeyId);
    const deleted = await deleteApiKey({ workspaceId: ctx.workspaceId, actorId: ctx.actorId, apiKeyId });
    return jsonSuccess(response, deleted);
});
// Endpoint: Track Usage Event (called by SDK / middleware)
apiKeysRouter.post("/:apiKeyId/usage", async (request, response) => {
    const authenticated = await authenticateApiKey(request.headers.authorization);
    if (!authenticated)
        return jsonError(response, 401, "UNAUTHORIZED", "Invalid API key");
    const payload = usageTrackSchema.parse(request.body);
    await trackApiKeyUsage({
        apiKeyId: authenticated.apiKey.id,
        path: payload.path,
        method: payload.method,
        statusCode: payload.statusCode,
        responseTimeMs: payload.responseTimeMs,
        ipAddress: payload.ipAddress ?? null,
        userAgent: payload.userAgent ?? null
    });
    return jsonSuccess(response, { tracked: true, apiKeyId: authenticated.apiKey.id, eventId: generateId("usage") }, 201);
});
