"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBackendJson } from "@/lib/backend";

export type ScoringCondition = {
  field: string;
  operator: string;
  value: string | number | string[];
};

export type ScoringRule = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  type: "positive" | "negative";
  condition: ScoringCondition;
  points: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ScoringStats = {
  totalLeads: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
  highScoreLeads: number;
  lowScoreLeads: number;
};

export type ScoreHistoryEntry = {
  id: string;
  leadId: string;
  ruleId: string | null;
  ruleName: string | null;
  ruleType: "positive" | "negative" | null;
  scoreBefore: number;
  scoreAfter: number;
  delta: number;
  reason: string;
  createdAt: string;
};

export type AiScoringHint = {
  name: string;
  description: string;
  type: "positive" | "negative";
  condition: ScoringCondition;
  points: number;
};

export function useScoringRules(workspaceId: string) {
  return useQuery({
    queryKey: ["scoring-rules", workspaceId],
    queryFn: () =>
      fetchBackendJson<{ data: { rules: ScoringRule[]; stats: ScoringStats } }>(
        `/api/v1/scoring/rules?workspaceId=${workspaceId}`,
        { method: "GET" }
      ).then((r) => r.data),
    enabled: !!workspaceId,
  });
}

export function useScoreHistory(leadId: string, page = 1) {
  return useQuery({
    queryKey: ["score-history", leadId, page],
    queryFn: () =>
      fetchBackendJson<{ data: { items: ScoreHistoryEntry[] }; meta: { total: number; pages: number } }>(
        `/api/v1/scoring/history/${leadId}?page=${page}&limit=50`,
        { method: "GET" }
      ),
    enabled: !!leadId,
  });
}

export function useScoringLeaderboard(workspaceId: string) {
  return useQuery({
    queryKey: ["scoring-leaderboard", workspaceId],
    queryFn: () =>
      fetchBackendJson<{ data: { top: Array<{ id: string; firstName: string; lastName: string; email: string; score: number; lifecycleStage: string }>; bottom: Array<{ id: string; firstName: string; lastName: string; email: string; score: number; lifecycleStage: string }> } }>(
        `/api/v1/scoring/leaderboard?workspaceId=${workspaceId}`,
        { method: "GET" }
      ).then((r) => r.data),
    enabled: !!workspaceId,
  });
}

export function useAiScoringHints(workspaceId: string) {
  return useQuery({
    queryKey: ["ai-scoring-hints", workspaceId],
    queryFn: () =>
      fetchBackendJson<{ data: { hints: AiScoringHint[] } }>(
        `/api/v1/scoring/ai-hints?workspaceId=${workspaceId}`,
        { method: "GET" }
      ).then((r) => r.data),
    enabled: !!workspaceId,
  });
}

export function useCreateScoringRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ScoringRule, "id" | "createdAt" | "updatedAt">) =>
      fetchBackendJson<{ data: ScoringRule }>("/api/v1/scoring/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scoring-rules"] }),
  });
}

export function useUpdateScoringRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<ScoringRule> & { id: string }) =>
      fetchBackendJson<{ data: ScoringRule }>(`/api/v1/scoring/rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scoring-rules"] }),
  });
}

export function useDeleteScoringRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchBackendJson(`/api/v1/scoring/rules/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scoring-rules"] }),
  });
}

export function useRecalculateScores() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId }: { workspaceId: string }) =>
      fetchBackendJson<{ data: { updated: number; total: number } }>(
        `/api/v1/scoring/recalculate?workspaceId=${workspaceId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId }),
        }
      ).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scoring-rules"] });
      qc.invalidateQueries({ queryKey: ["scoring-leaderboard"] });
    },
  });
}

export function useAdjustScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, delta, reason, workspaceId }: { leadId: string; delta: number; reason: string; workspaceId: string }) =>
      fetchBackendJson<{ data: { score: number } }>(
        `/api/v1/scoring/adjust?workspaceId=${workspaceId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, delta, reason }),
        }
      ).then((r) => r.data),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["score-history", vars.leadId] }),
  });
}
