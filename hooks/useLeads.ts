"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthSessionStore } from "@/lib/stores/auth-session";
import {
  listLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  addLeadNote,
  bulkLeadAction,
  updateLeadConsent,
  exportLeadsCsv,
  importLeadsCsv,
  type LeadStage,
  type LeadStatus,
  type CreateLeadPayload,
  type UpdateLeadPayload,
} from "@/lib/backend";

export type LeadListParams = {
  q?: string;
  stage?: LeadStage;
  status?: LeadStatus;
  source?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export function useLeads(params: LeadListParams = {}) {
  const queryClient = useQueryClient();
  const session = useAuthSessionStore((state) => state.session);
  const token = session?.accessToken ?? "";
  const workspaceId = session?.user?.memberships?.[0]?.workspaceId ?? "";

  // ─── Query: Lead List ────────────────────────────
  const leadsQuery = useQuery({
    queryKey: ["leads", workspaceId, params],
    queryFn: async () => {
      const res = await listLeads(workspaceId, params, token);
      return res;
    },
    enabled: !!token && !!workspaceId,
  });

  // ─── Mutation: Create Lead ───────────────────────
  const createLeadMutation = useMutation({
    mutationFn: (payload: CreateLeadPayload) => createLead(workspaceId, payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", workspaceId] });
    },
  });

  // ─── Mutation: Update Lead ───────────────────────
  const updateLeadMutation = useMutation({
    mutationFn: ({ leadId, payload }: { leadId: string; payload: UpdateLeadPayload }) =>
      updateLead(leadId, workspaceId, payload, token),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["lead", variables.leadId] });
    },
  });

  // ─── Mutation: Delete Lead ───────────────────────
  const deleteLeadMutation = useMutation({
    mutationFn: (leadId: string) => deleteLead(leadId, workspaceId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", workspaceId] });
    },
  });

  // ─── Mutation: Bulk Action ───────────────────────
  const bulkActionMutation = useMutation({
    mutationFn: (payload: { leadIds: string[]; action: "archive" | "activate" | "advance_stage"; stage?: LeadStage }) =>
      bulkLeadAction(workspaceId, payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", workspaceId] });
    },
  });

  // ─── Mutation: Import CSV ────────────────────────
  const importCsvMutation = useMutation({
    mutationFn: (csvText: string) => importLeadsCsv(workspaceId, csvText, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", workspaceId] });
    },
  });

  // ─── Action: Export CSV (download) ──────────────
  const exportCsv = async () => {
    const res = await exportLeadsCsv(workspaceId, token);
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    token,
    workspaceId,
    leadsQuery,
    items: leadsQuery.data?.data.items ?? [],
    meta: leadsQuery.data?.meta,
    isLoading: leadsQuery.isLoading,
    error: leadsQuery.error,
    createLeadMutation,
    updateLeadMutation,
    deleteLeadMutation,
    bulkActionMutation,
    importCsvMutation,
    exportCsv,
  };
}

export function useLeadDetail(leadId: string | null) {
  const session = useAuthSessionStore((state) => state.session);
  const token = session?.accessToken ?? "";
  const workspaceId = session?.user?.memberships?.[0]?.workspaceId ?? "";
  const queryClient = useQueryClient();

  const leadQuery = useQuery({
    queryKey: ["lead", leadId, workspaceId],
    queryFn: async () => {
      const res = await getLead(leadId!, workspaceId, token);
      return res.data;
    },
    enabled: !!leadId && !!token && !!workspaceId,
  });

  const addNoteMutation = useMutation({
    mutationFn: (note: string) => addLeadNote(leadId!, workspaceId, note, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
    },
  });

  const updateConsentMutation = useMutation({
    mutationFn: ({ type, granted }: { type: "email" | "sms"; granted: boolean }) =>
      updateLeadConsent(leadId!, workspaceId, type, granted, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: (payload: UpdateLeadPayload) => updateLead(leadId!, workspaceId, payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      queryClient.invalidateQueries({ queryKey: ["leads", workspaceId] });
    },
  });

  return {
    lead: leadQuery.data,
    isLoading: leadQuery.isLoading,
    error: leadQuery.error,
    addNoteMutation,
    updateConsentMutation,
    updateLeadMutation,
  };
}
