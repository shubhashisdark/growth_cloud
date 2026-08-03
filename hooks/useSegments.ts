"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBackendJson } from "@/lib/backend";

export type SegmentCondition = {
  field: string;
  operator: string;
  value: string | number | string[];
};

export type SegmentRules = {
  logic: "AND" | "OR";
  conditions: SegmentCondition[];
};

export type Segment = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  type: "dynamic" | "static";
  status: "active" | "paused" | "archived";
  rules: SegmentRules;
  memberCount: number;
  lastComputedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SegmentMember = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  score: number;
  lifecycleStage: string;
  addedAt?: string;
};

export type SegmentPreview = {
  workspaceId: string;
  matchCount: number;
  total: number;
  sample: Array<{ id: string; email: string; score: number; lifecycleStage: string }>;
};

export function useSegments(workspaceId: string) {
  return useQuery({
    queryKey: ["segments", workspaceId],
    queryFn: () =>
      fetchBackendJson<{ data: { items: Segment[] }; meta: { total: number } }>(
        `/api/v1/segments?workspaceId=${workspaceId}`,
        { method: "GET" }
      ).then((r) => r.data),
    enabled: !!workspaceId,
  });
}

export function useSegment(segmentId: string) {
  return useQuery({
    queryKey: ["segment", segmentId],
    queryFn: () =>
      fetchBackendJson<{ data: Segment }>(`/api/v1/segments/${segmentId}`, { method: "GET" }).then((r) => r.data),
    enabled: !!segmentId,
  });
}

export function useSegmentMembers(segmentId: string, page = 1, limit = 25) {
  return useQuery({
    queryKey: ["segment-members", segmentId, page],
    queryFn: () =>
      fetchBackendJson<{ data: { items: SegmentMember[] }; meta: { total: number; pages: number } }>(
        `/api/v1/segments/${segmentId}/members?page=${page}&limit=${limit}`,
        { method: "GET" }
      ),
    enabled: !!segmentId,
  });
}

export function useSegmentPreview(workspaceId: string, rules: SegmentRules | null) {
  return useQuery({
    queryKey: ["segment-preview", workspaceId, JSON.stringify(rules)],
    queryFn: () =>
      fetchBackendJson<{ data: SegmentPreview }>("/api/v1/segments/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, rules }),
      }).then((r) => r.data),
    enabled: !!workspaceId && !!rules,
    staleTime: 5000,
  });
}

export function useCreateSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Segment, "id" | "memberCount" | "lastComputedAt" | "createdAt" | "updatedAt">) =>
      fetchBackendJson<{ data: Segment }>("/api/v1/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["segments"] }),
  });
}

export function useUpdateSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Segment> & { id: string }) =>
      fetchBackendJson<{ data: Segment }>(`/api/v1/segments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["segments"] });
      qc.invalidateQueries({ queryKey: ["segment", vars.id] });
    },
  });
}

export function useDeleteSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchBackendJson(`/api/v1/segments/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["segments"] }),
  });
}

export function useAddSegmentMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ segmentId, leadId }: { segmentId: string; leadId: string }) =>
      fetchBackendJson(`/api/v1/segments/${segmentId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      }),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["segment-members", vars.segmentId] }),
  });
}

export function useRemoveSegmentMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ segmentId, leadId }: { segmentId: string; leadId: string }) =>
      fetchBackendJson(`/api/v1/segments/${segmentId}/members/${leadId}`, { method: "DELETE" }),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["segment-members", vars.segmentId] }),
  });
}

export function useComputeSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (segmentId: string) =>
      fetchBackendJson(`/api/v1/segments/${segmentId}/compute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["segments"] });
      qc.invalidateQueries({ queryKey: ["segment", id] });
    },
  });
}
