import { randomUUID } from "node:crypto";

import { prisma } from "../data/prisma.js";

export async function logAudit(action: string, entityType: string, entityId: string, workspaceId?: string | null, actorId?: string | null, metadata: Record<string, unknown> = {}) {
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
