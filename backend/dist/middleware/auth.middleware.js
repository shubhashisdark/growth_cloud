import { extractBearerToken, verifyAccessToken } from "../lib/auth.js";
import { sendError } from "../lib/response.js";
import { prisma } from "../data/prisma.js";
export async function requireAuth(req, res, next) {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
        return sendError(res, "UNAUTHORIZED", "Authentication is required", 401);
    }
    const verified = verifyAccessToken(token);
    if (!verified) {
        return sendError(res, "UNAUTHORIZED", "Invalid or expired access token", 401);
    }
    const session = await prisma.session.findUnique({
        where: { id: verified.sessionId }
    });
    if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) {
        return sendError(res, "UNAUTHORIZED", "Session expired or revoked", 401);
    }
    req.actor = {
        userId: verified.userId,
        sessionId: verified.sessionId
    };
    next();
}
export function requireWorkspaceMember(allowedRoles) {
    return async (req, res, next) => {
        if (!req.actor) {
            return sendError(res, "UNAUTHORIZED", "Authentication is required", 401);
        }
        const workspaceId = req.params.workspaceId ||
            req.query.workspaceId ||
            req.body?.workspaceId ||
            req.headers["x-workspace-id"] ||
            req.params.id;
        if (!workspaceId) {
            if (req.workspace?.workspaceId) {
                req.workspace = {
                    workspaceId: req.workspace.workspaceId,
                    role: req.workspace.role
                };
                return next();
            }
            return sendError(res, "BAD_REQUEST", "Workspace ID is required for workspace operations", 400);
        }
        const member = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: req.actor.userId
                }
            }
        });
        if (!member) {
            return sendError(res, "FORBIDDEN", "You are not a member of this workspace", 403);
        }
        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(member.role)) {
            return sendError(res, "FORBIDDEN", `Insufficient permissions. Requires one of: ${allowedRoles.join(", ")}`, 403);
        }
        req.workspace = {
            workspaceId: member.workspaceId,
            role: member.role
        };
        next();
    };
}
