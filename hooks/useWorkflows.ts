"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBackendJson } from "@/lib/backend";

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

export function useWorkflows(workspaceId: string) {
  return useQuery({
    queryKey: ["workflows", workspaceId],
    queryFn: () =>
      fetchBackendJson<{ data: { items: Workflow[] }; meta: { total: number } }>(
        `/api/v1/workflows?workspaceId=${workspaceId}`,
        { method: "GET" }
      ).then((r) => r.data),
    enabled: !!workspaceId,
  });
}

export function useWorkflow(workflowId: string) {
  return useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: () =>
      fetchBackendJson<{ data: Workflow }>(`/api/v1/workflows/${workflowId}`, { method: "GET" }).then((r) => r.data),
    enabled: !!workflowId,
  });
}

export function useWorkflowRuns(workflowId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["workflow-runs", workflowId, page],
    queryFn: () =>
      fetchBackendJson<{ data: { items: WorkflowRun[] }; meta: { total: number; pages: number } }>(
        `/api/v1/workflows/${workflowId}/runs?page=${page}&limit=${limit}`,
        { method: "GET" }
      ),
    enabled: !!workflowId,
  });
}

export function useWorkflowRunDetail(workflowId: string, runId: string) {
  return useQuery({
    queryKey: ["workflow-run", runId],
    queryFn: () =>
      fetchBackendJson<{ data: WorkflowRunDetail }>(
        `/api/v1/workflows/${workflowId}/runs/${runId}`,
        { method: "GET" }
      ).then((r) => r.data),
    enabled: !!workflowId && !!runId,
  });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Workflow, "id" | "runCount" | "errorCount" | "lastRunAt" | "createdAt" | "updatedAt" | "stepCount">) =>
      fetchBackendJson<{ data: Workflow }>("/api/v1/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });
}

export function useUpdateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Workflow> & { id: string }) =>
      fetchBackendJson<{ data: Workflow }>(`/api/v1/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      qc.invalidateQueries({ queryKey: ["workflow", vars.id] });
    },
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchBackendJson(`/api/v1/workflows/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });
}

export function useTriggerWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workflowId, leadId, input }: { workflowId: string; leadId?: string; input?: Record<string, unknown> }) =>
      fetchBackendJson(`/api/v1/workflows/${workflowId}/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, input }),
      }),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["workflow-runs", vars.workflowId] }),
  });
}
