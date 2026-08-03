"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthSessionStore } from "@/lib/stores/auth-session";
import {
  listEmailCampaigns,
  getEmailCampaign,
  createEmailCampaign,
  sendEmailCampaign,
  deleteEmailCampaign,
  listEmailTemplates,
  createEmailTemplate,
  deleteEmailTemplate,
  sendSingleEmail,
  listEmailSuppressions,
} from "@/lib/backend";

export function useCampaigns() {
  const queryClient = useQueryClient();
  const session = useAuthSessionStore((state) => state.session);
  const token = session?.accessToken ?? "";
  const workspaceId = session?.user?.memberships?.[0]?.workspaceId ?? "";

  // Query: Campaigns list
  const campaignsQuery = useQuery({
    queryKey: ["campaigns", workspaceId],
    queryFn: async () => {
      const res = await listEmailCampaigns(workspaceId, token);
      return res.data.items;
    },
    enabled: !!token && !!workspaceId,
  });

  // Query: Templates list
  const templatesQuery = useQuery({
    queryKey: ["email-templates", workspaceId],
    queryFn: async () => {
      const res = await listEmailTemplates(workspaceId, token);
      return res.data.items;
    },
    enabled: !!token && !!workspaceId,
  });

  // Query: Suppressions list
  const suppressionsQuery = useQuery({
    queryKey: ["email-suppressions", workspaceId],
    queryFn: async () => {
      const res = await listEmailSuppressions(workspaceId, token);
      return res.data.items;
    },
    enabled: !!token && !!workspaceId,
  });

  // Mutation: Create campaign
  const createCampaignMutation = useMutation({
    mutationFn: (payload: { name: string; subject: string; fromName?: string; templateId?: string; scheduledAt?: string }) =>
      createEmailCampaign(workspaceId, payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", workspaceId] });
    },
  });

  // Mutation: Send campaign
  const sendCampaignMutation = useMutation({
    mutationFn: (campaignId: string) => sendEmailCampaign(campaignId, workspaceId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", workspaceId] });
    },
  });

  // Mutation: Delete campaign
  const deleteCampaignMutation = useMutation({
    mutationFn: (campaignId: string) => deleteEmailCampaign(campaignId, workspaceId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", workspaceId] });
    },
  });

  // Mutation: Create template
  const createTemplateMutation = useMutation({
    mutationFn: (payload: { name: string; subject: string; htmlContent: string; textContent?: string; variables?: string[] }) =>
      createEmailTemplate(workspaceId, payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates", workspaceId] });
    },
  });

  // Mutation: Delete template
  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => deleteEmailTemplate(templateId, workspaceId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates", workspaceId] });
    },
  });

  // Mutation: Single Send
  const singleSendMutation = useMutation({
    mutationFn: (payload: { to: string; recipientName?: string; subject: string; html: string }) =>
      sendSingleEmail(workspaceId, payload, token),
  });

  return {
    token,
    workspaceId,
    campaigns: campaignsQuery.data ?? [],
    templates: templatesQuery.data ?? [],
    suppressions: suppressionsQuery.data ?? [],
    isLoading: campaignsQuery.isLoading || templatesQuery.isLoading,
    error: campaignsQuery.error || templatesQuery.error,
    createCampaignMutation,
    sendCampaignMutation,
    deleteCampaignMutation,
    createTemplateMutation,
    deleteTemplateMutation,
    singleSendMutation,
  };
}

export function useCampaignDetail(campaignId: string | null) {
  const session = useAuthSessionStore((state) => state.session);
  const token = session?.accessToken ?? "";
  const workspaceId = session?.user?.memberships?.[0]?.workspaceId ?? "";

  const campaignQuery = useQuery({
    queryKey: ["campaign", campaignId, workspaceId],
    queryFn: async () => {
      const res = await getEmailCampaign(campaignId!, workspaceId, token);
      return res.data;
    },
    enabled: !!campaignId && !!token && !!workspaceId,
  });

  return {
    campaign: campaignQuery.data,
    isLoading: campaignQuery.isLoading,
    error: campaignQuery.error,
  };
}
