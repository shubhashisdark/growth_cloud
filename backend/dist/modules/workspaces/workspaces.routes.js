import { Router } from "express";
import { WorkspacesController } from "./controllers/workspaces.controller.js";
import { requireAuth, requireWorkspaceMember } from "../../middleware/auth.middleware.js";
const workspacesController = new WorkspacesController();
export const workspacesRouter = Router();
// Workspaces collection routes
workspacesRouter.get("/", requireAuth, workspacesController.list);
workspacesRouter.post("/", requireAuth, workspacesController.create);
// Single workspace routes
workspacesRouter.get("/:workspaceId", requireAuth, requireWorkspaceMember(), workspacesController.get);
workspacesRouter.patch("/:workspaceId", requireAuth, requireWorkspaceMember(["super_admin", "admin"]), workspacesController.update);
// Workspace members
workspacesRouter.get("/:workspaceId/members", requireAuth, requireWorkspaceMember(), workspacesController.listMembers);
workspacesRouter.post("/:workspaceId/members", requireAuth, requireWorkspaceMember(["super_admin", "admin"]), workspacesController.createMember);
workspacesRouter.delete("/:workspaceId/members/:userId", requireAuth, requireWorkspaceMember(["super_admin", "admin"]), workspacesController.removeMember);
workspacesRouter.patch("/:workspaceId/members/:userId", requireAuth, requireWorkspaceMember(["super_admin", "admin"]), workspacesController.updateMemberRole);
// Workspace invitations
workspacesRouter.get("/:workspaceId/invitations", requireAuth, requireWorkspaceMember(["super_admin", "admin"]), workspacesController.listInvitations);
workspacesRouter.post("/:workspaceId/invitations", requireAuth, requireWorkspaceMember(["super_admin", "admin"]), workspacesController.sendInvitation);
workspacesRouter.delete("/:workspaceId/invitations/:invitationId", requireAuth, requireWorkspaceMember(["super_admin", "admin"]), workspacesController.revokeInvitation);
