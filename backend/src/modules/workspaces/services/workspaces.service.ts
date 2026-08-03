import { randomUUID } from "node:crypto";
import { prisma } from "../../../data/prisma.js";
import { createVerificationTokenMaterial, slugify } from "../../../lib/auth.js";
import { logAudit } from "../../../lib/audit.js";
import { getConfig } from "../../../config/env.js";
import { buildInvitationEmail, sendEmailWithFallback } from "../../email/email.service.js";
import type { CreateWorkspaceDto, UpdateWorkspaceDto, CreateWorkspaceMemberDto, UpdateWorkspaceMemberRoleDto, SendInvitationDto } from "../dto.js";

const rolePriority: Record<string, number> = {
  super_admin: 0,
  admin: 1,
  marketer: 2,
  developer: 3,
  sales: 4,
  viewer: 5,
};

export class WorkspacesService {
  async listWorkspaces(userId?: string) {
    let workspaces;
    if (userId) {
      workspaces = await prisma.workspace.findMany({
        where: {
          memberships: {
            some: { userId }
          }
        },
        orderBy: { createdAt: "asc" }
      });
    } else {
      workspaces = await prisma.workspace.findMany({ orderBy: { createdAt: "asc" } });
    }
    return { status: 200, data: { workspaces } };
  }

  async getWorkspace(workspaceId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { memberships: true, apiKeys: true, leads: true }
        }
      }
    });

    if (!workspace) {
      return { error: { code: "NOT_FOUND", message: "Workspace not found" }, status: 404 };
    }

    return { status: 200, data: { workspace } };
  }

  async createWorkspace(ownerId: string, input: CreateWorkspaceDto) {
    let workspaceSlug = input.slug ? slugify(input.slug) : slugify(input.name);
    if (!workspaceSlug) workspaceSlug = `workspace-${randomUUID().slice(0, 6)}`;

    const existing = await prisma.workspace.findUnique({ where: { slug: workspaceSlug } });
    if (existing) {
      if (input.slug) {
        return { error: { code: "SLUG_ALREADY_EXISTS", message: "A workspace with this slug already exists" }, status: 409 };
      }
      workspaceSlug = `${workspaceSlug}-${randomUUID().slice(0, 6)}`;
    }

    const workspaceId = `ws_${randomUUID().replace(/-/g, "").slice(0, 12)}`;

    const workspace = await prisma.workspace.create({
      data: {
        id: workspaceId,
        name: input.name,
        slug: workspaceSlug,
        plan: "trial",
        timezone: input.timezone || "UTC",
        status: "active",
        ownerId
      }
    });

    await prisma.workspaceMember.create({
      data: {
        id: `wm_${randomUUID().slice(0, 8)}`,
        workspaceId: workspace.id,
        userId: ownerId,
        role: "super_admin"
      }
    });

    await logAudit("workspace.created", "Workspace", workspace.id, workspace.id, ownerId, { name: input.name });

    return { status: 201, data: { workspace } };
  }

  async updateWorkspace(workspaceId: string, input: UpdateWorkspaceDto, actorUserId: string) {
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      return { error: { code: "NOT_FOUND", message: "Workspace not found" }, status: 404 };
    }

    const dataToUpdate: Record<string, unknown> = {};
    if (input.name) dataToUpdate.name = input.name;
    if (input.timezone) dataToUpdate.timezone = input.timezone;
    if (input.slug) {
      const newSlug = slugify(input.slug);
      if (newSlug !== workspace.slug) {
        const existing = await prisma.workspace.findUnique({ where: { slug: newSlug } });
        if (existing) {
          return { error: { code: "SLUG_ALREADY_EXISTS", message: "Slug is already in use" }, status: 409 };
        }
        dataToUpdate.slug = newSlug;
      }
    }

    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: dataToUpdate
    });

    await logAudit("workspace.updated", "Workspace", workspaceId, workspaceId, actorUserId, dataToUpdate);

    return { status: 200, data: { workspace: updated } };
  }

  async listMembers(workspaceId: string) {
    const members = await prisma.workspaceMember.findMany({ where: { workspaceId }, include: { user: true } });
    const sortedMembers = members
      .map((member) => ({
        id: member.id,
        workspaceId: member.workspaceId,
        userId: member.userId,
        name: member.user.name,
        email: member.user.email,
        role: member.role,
        createdAt: member.createdAt,
      }))
      .sort((a, b) => {
        const roleDifference = rolePriority[a.role] - rolePriority[b.role];
        if (roleDifference !== 0) return roleDifference;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    return { status: 200, data: { items: sortedMembers.map(({ createdAt, ...member }) => member) } };
  }

  async createMember(workspaceId: string, input: CreateWorkspaceMemberDto) {
    const existingUser = await prisma.user.findUnique({ where: { email: input.email.trim().toLowerCase() } });
    let userId = existingUser?.id;

    if (!existingUser) {
      userId = `usr_${randomUUID().slice(0, 8)}`;
      await prisma.user.create({
        data: {
          id: userId,
          name: input.name,
          email: input.email.trim().toLowerCase(),
          passwordHash: "invited-user",
          status: "pending_verification",
        },
      });
    }

    const existingMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: userId! } }
    });

    if (existingMember) {
      return { error: { code: "MEMBER_ALREADY_EXISTS", message: "User is already a member of this workspace" }, status: 409 };
    }

    const membership = await prisma.workspaceMember.create({
      data: {
        id: `wm_${randomUUID().slice(0, 8)}`,
        workspaceId,
        userId: userId!,
        role: input.role as any,
      },
    });

    return {
      status: 201,
      data: {
        id: membership.id,
        workspaceId: membership.workspaceId,
        userId: membership.userId,
        name: input.name,
        email: input.email,
        role: membership.role,
      },
    };
  }

  async removeMember(workspaceId: string, memberUserId: string, actorUserId: string) {
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      return { error: { code: "NOT_FOUND", message: "Workspace not found" }, status: 404 };
    }

    if (workspace.ownerId === memberUserId) {
      return { error: { code: "CANNOT_REMOVE_OWNER", message: "Cannot remove workspace owner from workspace" }, status: 400 };
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: memberUserId } }
    });

    if (!member) {
      return { error: { code: "MEMBER_NOT_FOUND", message: "Member not found in workspace" }, status: 404 };
    }

    await prisma.workspaceMember.delete({
      where: { id: member.id }
    });

    await logAudit("workspace.member_removed", "WorkspaceMember", member.id, workspaceId, actorUserId, { removedUserId: memberUserId });

    return { status: 200, data: { success: true } };
  }

  async updateMemberRole(workspaceId: string, memberUserId: string, input: UpdateWorkspaceMemberRoleDto, actorUserId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: memberUserId } }
    });

    if (!member) {
      return { error: { code: "MEMBER_NOT_FOUND", message: "Member not found in workspace" }, status: 404 };
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: member.id },
      data: { role: input.role as any }
    });

    await logAudit("workspace.member_role_updated", "WorkspaceMember", member.id, workspaceId, actorUserId, { memberUserId, newRole: input.role });

    return { status: 200, data: { id: updated.id, workspaceId: updated.workspaceId, userId: updated.userId, role: updated.role } };
  }

  async sendInvitation(workspaceId: string, actorUserId: string, input: SendInvitationDto) {
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      return { error: { code: "NOT_FOUND", message: "Workspace not found" }, status: 404 };
    }

    const inviter = await prisma.user.findUnique({ where: { id: actorUserId } });
    const normalizedEmail = input.email.trim().toLowerCase();

    const existingMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId, user: { email: normalizedEmail } }
    });

    if (existingMember) {
      return { error: { code: "ALREADY_MEMBER", message: "User is already a member of this workspace" }, status: 409 };
    }

    const tokenMaterial = createVerificationTokenMaterial("email_verification");
    const invitation = await prisma.workspaceInvitation.create({
      data: {
        id: `inv_${randomUUID().slice(0, 8)}`,
        workspaceId,
        inviterId: actorUserId,
        email: normalizedEmail,
        role: input.role as any,
        tokenHash: tokenMaterial.tokenHash,
        status: "pending",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      }
    });

    const baseUrl = getConfig().appBaseUrl || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/accept-invitation/${tokenMaterial.plaintextToken}`;
    const emailPayload = buildInvitationEmail(inviter?.name || "A team member", workspace.name, inviteUrl);
    await sendEmailWithFallback({ to: normalizedEmail, ...emailPayload });

    await logAudit("workspace.invitation_sent", "WorkspaceInvitation", invitation.id, workspaceId, actorUserId, { email: normalizedEmail, role: input.role });

    return {
      status: 201,
      data: {
        invitation: {
          id: invitation.id,
          workspaceId: invitation.workspaceId,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          inviteToken: getConfig().exposeResetTokenInResponse ? tokenMaterial.plaintextToken : null
        }
      }
    };
  }

  async listInvitations(workspaceId: string) {
    const invitations = await prisma.workspaceInvitation.findMany({
      where: { workspaceId, status: "pending" },
      orderBy: { createdAt: "desc" }
    });

    return { status: 200, data: { items: invitations } };
  }

  async revokeInvitation(workspaceId: string, invitationId: string, actorUserId: string) {
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation || invitation.workspaceId !== workspaceId) {
      return { error: { code: "NOT_FOUND", message: "Invitation not found" }, status: 404 };
    }

    const updated = await prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: { status: "revoked" }
    });

    await logAudit("workspace.invitation_revoked", "WorkspaceInvitation", invitationId, workspaceId, actorUserId, { email: invitation.email });

    return { status: 200, data: { success: true } };
  }
}
