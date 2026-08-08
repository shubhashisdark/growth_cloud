"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBackendJson, getWorkspaceAuthHeaders } from "@/lib/backend";
import { useAuthSessionStore } from "@/lib/stores/auth-session";

export type WorkflowStep = {
  index: number;
  type: "trigger" | "condition" | "action" | "delay";
  actionType?: string;
  conditionField?: string;
  conditionOperator?: string;
  conditionValue?: unknown;
  delayMinutes?: number;
  config?: Record<string, unknown>;
};

export type WorkflowDefinition = {
  trigger: { type: string; config?: Record<string, unknown> };
  steps: WorkflowStep[];
};

export type Workflow = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  status: "active" | "paused" | "archived";
  triggerType: string;
  stepCount: number;
  runCount: number;
  errorCount: number;
  lastRunAt: string | null;
  definition: WorkflowDefinition;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowRun = {
  id: string;
  workflowId: string;
  leadId: string | null;
  leadEmail?: string | null;
  leadName?: string | null;
  status: "running" | "completed" | "failed" | "cancelled";
  triggerEvent: string;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
};

export type WorkflowRunDetail = WorkflowRun & {
  stepLogs: Array<{
    id: string;
    stepIndex: number;
    stepType: string;
    status: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    errorMessage: string | null;
    durationMs: number | null;
    createdAt: string;
  }>;
};

function useAccessToken() {
  return useAuthSessionStore((state) => state.session?.accessToken ?? "");
}

export function useWorkflows(workspaceId: string) {
  const token = useAccessToken();
  return useQuery({
    queryKey: ["workflows", workspaceId, token],
    queryFn: () =>
      fetchBackendJson<{ data: { items: Workflow[] }; meta: { total: number } }>(
        `/api/v1/workflows?workspaceId=${workspaceId}`,
        { method: "GET", headers: getWorkspaceAuthHeaders(workspaceId, token) }
      ).then((r) => r.data),
    enabled: !!workspaceId && !!token,
  });
}

export function useWorkflow(workflowId: string, workspaceId?: string) {
  const token = useAccessToken();
  const sessionWorkspace =
    useAuthSessionStore((state) => state.session?.workspaceId ?? state.session?.user?.memberships?.[0]?.workspaceId ?? "");
  const ws = workspaceId || sessionWorkspace;

  return useQuery({
    queryKey: ["workflow", workflowId, ws, token],
    queryFn: () =>
      fetchBackendJson<{ data: Workflow }>(
        `/api/v1/workflows/${workflowId}?workspaceId=${encodeURIComponent(ws)}`,
        { method: "GET", headers: getWorkspaceAuthHeaders(ws, token) }
      ).then((r) => r.data),
    enabled: !!workflowId && !!ws && !!token,
  });
}

export function useWorkflowRuns(workflowId: string, page = 1, limit = 20, workspaceId?: string, q = "") {
  const token = useAccessToken();
  const sessionWorkspace =
    useAuthSessionStore((state) => state.session?.workspaceId ?? state.session?.user?.memberships?.[0]?.workspaceId ?? "");
  const ws = workspaceId || sessionWorkspace;
  const search = q.trim();

  return useQuery({
    queryKey: ["workflow-runs", workflowId, page, limit, search, ws, token],
    queryFn: () => {
      const params = new URLSearchParams({
        workspaceId: ws,
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set("q", search);
      return fetchBackendJson<{ data: { items: WorkflowRun[] }; meta: { total: number; pages: number } }>(
        `/api/v1/workflows/${workflowId}/runs?${params.toString()}`,
        { method: "GET", headers: getWorkspaceAuthHeaders(ws, token) }
      );
    },
    enabled: !!workflowId && !!ws && !!token,
  });
}

export function useWorkflowRunDetail(workflowId: string, runId: string, workspaceId?: string) {
  const token = useAccessToken();
  const sessionWorkspace =
    useAuthSessionStore((state) => state.session?.workspaceId ?? state.session?.user?.memberships?.[0]?.workspaceId ?? "");
  const ws = workspaceId || sessionWorkspace;

  return useQuery({
    queryKey: ["workflow-run", runId, ws, token],
    queryFn: () =>
      fetchBackendJson<{ data: WorkflowRunDetail }>(
        `/api/v1/workflows/${workflowId}/runs/${runId}?workspaceId=${encodeURIComponent(ws)}`,
        { method: "GET", headers: getWorkspaceAuthHeaders(ws, token) }
      ).then((r) => r.data),
    enabled: !!workflowId && !!runId && !!ws && !!token,
  });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  const token = useAccessToken();
  return useMutation({
    mutationFn: (data: Omit<Workflow, "id" | "runCount" | "errorCount" | "lastRunAt" | "createdAt" | "updatedAt" | "stepCount">) =>
      fetchBackendJson<{ data: Workflow }>("/api/v1/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getWorkspaceAuthHeaders(data.workspaceId, token) },
        body: JSON.stringify(data),
      }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });
}

export function useUpdateWorkflow() {
  const qc = useQueryClient();
  const token = useAccessToken();
  return useMutation({
    mutationFn: ({ id, workspaceId, ...data }: Partial<Workflow> & { id: string; workspaceId?: string }) =>
      fetchBackendJson<{ data: Workflow }>(`/api/v1/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getWorkspaceAuthHeaders(workspaceId, token) },
        body: JSON.stringify({ workspaceId, ...data }),
      }).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      qc.invalidateQueries({ queryKey: ["workflow", vars.id] });
    },
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  const token = useAccessToken();
  return useMutation({
    mutationFn: (id: string) =>
      fetchBackendJson(`/api/v1/workflows/${id}`, {
        method: "DELETE",
        headers: getWorkspaceAuthHeaders(undefined, token),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });
}

export function useTriggerWorkflow() {
  const qc = useQueryClient();
  const token = useAccessToken();
  return useMutation({
    mutationFn: ({
      workflowId,
      leadId,
      input,
      workspaceId,
    }: {
      workflowId: string;
      leadId?: string;
      input?: Record<string, unknown>;
      workspaceId?: string;
    }) =>
      fetchBackendJson(`/api/v1/workflows/${workflowId}/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getWorkspaceAuthHeaders(workspaceId, token) },
        body: JSON.stringify({ leadId, input, workspaceId }),
      }),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["workflow-runs", vars.workflowId] }),
  });
}
