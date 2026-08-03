"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthSessionStore } from "@/lib/stores/auth-session";
import {
  getWorkspaces,
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  getWorkspaceMembers,
  createWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
  sendInvitation,
  listInvitations,
  revokeInvitation,
  WorkspaceMember
} from "@/lib/backend";

export function useWorkspace(workspaceId?: string) {
  const queryClient = useQueryClient();
  const session = useAuthSessionStore((state) => state.session);
  const token = session?.accessToken || "";

  const activeId = workspaceId || session?.user?.memberships?.[0]?.workspaceId || "";

  // List all workspaces for the current user
  const workspacesQuery = useQuery({
    queryKey: ["workspaces", token],
    queryFn: async () => {
      const res = await getWorkspaces(token);
      return res.data.workspaces;
    },
    enabled: !!token,
  });

  // Get current workspace details
  const workspaceDetailQuery = useQuery({
    queryKey: ["workspace", activeId, token],
    queryFn: async () => {
      const res = await getWorkspace(token, activeId);
      return res.data.workspace;
    },
    enabled: !!token && !!activeId,
  });

  // Get workspace members
  const membersQuery = useQuery({
    queryKey: ["workspace", activeId, "members", token],
    queryFn: async () => {
      const res = await getWorkspaceMembers(activeId, token);
      return res.data.items;
    },
    enabled: !!token && !!activeId,
  });

  // Get pending invitations
  const invitationsQuery = useQuery({
    queryKey: ["workspace", activeId, "invitations", token],
    queryFn: async () => {
      const res = await listInvitations(token, activeId);
      return res.data.items;
    },
    enabled: !!token && !!activeId,
  });

  // Create workspace mutation
  const createWorkspaceMutation = useMutation({
    mutationFn: (payload: { name: string; slug?: string; timezone?: string }) =>
      createWorkspace(token, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  // Update workspace mutation
  const updateWorkspaceMutation = useMutation({
    mutationFn: (payload: { name?: string; slug?: string; timezone?: string }) =>
      updateWorkspace(token, activeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", activeId] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: (payload: { name: string; email: string; role: WorkspaceMember["role"] }) =>
      createWorkspaceMember({ workspaceId: activeId, ...payload }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", activeId, "members"] });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => removeWorkspaceMember(token, activeId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", activeId, "members"] });
    },
  });

  // Update member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: WorkspaceMember["role"] }) =>
      updateWorkspaceMemberRole(token, activeId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", activeId, "members"] });
    },
  });

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: (payload: { email: string; role: WorkspaceMember["role"] }) =>
      sendInvitation(token, activeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", activeId, "invitations"] });
    },
  });

  // Revoke invitation mutation
  const revokeInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => revokeInvitation(token, activeId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", activeId, "invitations"] });
    },
  });

  return {
    workspaces: workspacesQuery.data ?? [],
    workspace: workspaceDetailQuery.data ?? null,
    members: membersQuery.data ?? [],
    invitations: invitationsQuery.data ?? [],
    isLoadingWorkspaces: workspacesQuery.isLoading,
    isLoadingWorkspace: workspaceDetailQuery.isLoading,
    isLoadingMembers: membersQuery.isLoading,
    isLoadingInvitations: invitationsQuery.isLoading,
    createWorkspace: createWorkspaceMutation.mutateAsync,
    updateWorkspace: updateWorkspaceMutation.mutateAsync,
    addMember: addMemberMutation.mutateAsync,
    removeMember: removeMemberMutation.mutateAsync,
    updateMemberRole: updateMemberRoleMutation.mutateAsync,
    sendInvitation: sendInvitationMutation.mutateAsync,
    revokeInvitation: revokeInvitationMutation.mutateAsync,
  };
}
