export type WorkspaceRoleType = "super_admin" | "admin" | "marketer" | "developer" | "sales" | "viewer";

export interface CreateWorkspaceDto {
  name: string;
  slug?: string;
  timezone?: string;
}

export interface UpdateWorkspaceDto {
  name?: string;
  slug?: string;
  timezone?: string;
}

export interface CreateWorkspaceMemberDto {
  name: string;
  email: string;
  role: WorkspaceRoleType;
}

export interface UpdateWorkspaceMemberRoleDto {
  role: WorkspaceRoleType;
}

export interface SendInvitationDto {
  email: string;
  role: WorkspaceRoleType;
}
