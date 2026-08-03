import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../../../lib/response.js";
import { WorkspacesService } from "../services/workspaces.service.js";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  createMemberSchema,
  updateMemberRoleSchema,
  sendInvitationSchema
} from "../validators.js";

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
}

export class WorkspacesController {
  constructor(private readonly workspacesService = new WorkspacesService()) {}

  list = async (request: Request, response: Response) => {
    const userId = request.actor?.userId;
    const result = await this.workspacesService.listWorkspaces(userId);
    return sendSuccess(response, result.data, { total: (result.data as any).workspaces.length });
  };

  get = async (request: Request, response: Response) => {
    const workspaceId = getParam(request.params.workspaceId);
    const result = await this.workspacesService.getWorkspace(workspaceId);
    if (result.error) {
      return sendError(response, result.error.code, result.error.message, result.status);
    }
    return sendSuccess(response, result.data);
  };

  create = async (request: Request, response: Response) => {
    const actorUserId = request.actor?.userId;
    if (!actorUserId) {
      return sendError(response, "UNAUTHORIZED", "Authentication is required", 401);
    }
    const payload = createWorkspaceSchema.parse(request.body);
    const result = await this.workspacesService.createWorkspace(actorUserId, payload);
    if (result.error) {
      return sendError(response, result.error.code, result.error.message, result.status);
    }
    return sendSuccess(response, result.data, { status: "created" });
  };

  update = async (request: Request, response: Response) => {
    const workspaceId = getParam(request.params.workspaceId);
    const actorUserId = request.actor?.userId || "";
    const payload = updateWorkspaceSchema.parse(request.body);
    const result = await this.workspacesService.updateWorkspace(workspaceId, payload, actorUserId);
    if (result.error) {
      return sendError(response, result.error.code, result.error.message, result.status);
    }
    return sendSuccess(response, result.data);
  };

  listMembers = async (request: Request, response: Response) => {
    const workspaceId = getParam(request.params.workspaceId);
    const result = await this.workspacesService.listMembers(workspaceId);
    return sendSuccess(response, result.data, { total: (result.data as any).items.length });
  };

  createMember = async (request: Request, response: Response) => {
    const workspaceId = getParam(request.params.workspaceId);
    const payload = createMemberSchema.parse(request.body);
    const result = await this.workspacesService.createMember(workspaceId, payload);
    if (result.error) {
      return sendError(response, result.error.code, result.error.message, result.status);
    }
    return sendSuccess(response, result.data, { status: "created" });
  };

  removeMember = async (request: Request, response: Response) => {
    const workspaceId = getParam(request.params.workspaceId);
    const memberUserId = getParam(request.params.userId);
    const actorUserId = request.actor?.userId || "";
    const result = await this.workspacesService.removeMember(workspaceId, memberUserId, actorUserId);
    if (result.error) {
      return sendError(response, result.error.code, result.error.message, result.status);
    }
    return sendSuccess(response, result.data);
  };

  updateMemberRole = async (request: Request, response: Response) => {
    const workspaceId = getParam(request.params.workspaceId);
    const memberUserId = getParam(request.params.userId);
    const actorUserId = request.actor?.userId || "";
    const payload = updateMemberRoleSchema.parse(request.body);
    const result = await this.workspacesService.updateMemberRole(workspaceId, memberUserId, payload, actorUserId);
    if (result.error) {
      return sendError(response, result.error.code, result.error.message, result.status);
    }
    return sendSuccess(response, result.data);
  };

  sendInvitation = async (request: Request, response: Response) => {
    const workspaceId = getParam(request.params.workspaceId);
    const actorUserId = request.actor?.userId || "";
    const payload = sendInvitationSchema.parse(request.body);
    const result = await this.workspacesService.sendInvitation(workspaceId, actorUserId, payload);
    if (result.error) {
      return sendError(response, result.error.code, result.error.message, result.status);
    }
    return sendSuccess(response, result.data, { status: "created" });
  };

  listInvitations = async (request: Request, response: Response) => {
    const workspaceId = getParam(request.params.workspaceId);
    const result = await this.workspacesService.listInvitations(workspaceId);
    return sendSuccess(response, result.data, { total: (result.data as any).items.length });
  };

  revokeInvitation = async (request: Request, response: Response) => {
    const workspaceId = getParam(request.params.workspaceId);
    const invitationId = getParam(request.params.invitationId);
    const actorUserId = request.actor?.userId || "";
    const result = await this.workspacesService.revokeInvitation(workspaceId, invitationId, actorUserId);
    if (result.error) {
      return sendError(response, result.error.code, result.error.message, result.status);
    }
    return sendSuccess(response, result.data);
  };
}
