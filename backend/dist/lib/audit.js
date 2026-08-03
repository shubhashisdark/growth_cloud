import { randomUUID } from "node:crypto";
import { prisma } from "../data/prisma.js";
export async function logAudit(action, entityType, entityId, workspaceId, actorId, metadata = {}) {
    await prisma.auditLog.create({
        data: {
            id: `audit_${randomUUID().slice(0, 12)}`,
            workspaceId: workspaceId ?? null,
            actorId: actorId ?? null,
            action,
            entityType,
            entityId,
            metadataJson: JSON.stringify(metadata),
        },
    });
}
