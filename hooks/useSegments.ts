"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBackendJson, getWorkspaceAuthHeaders } from "@/lib/backend";
import { useAuthSessionStore } from "@/lib/stores/auth-session";

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

function useAccessToken() {
  return useAuthSessionStore((state) => state.session?.accessToken ?? "");
}

function useSessionWorkspaceId() {
  return useAuthSessionStore(
    (state) => state.session?.workspaceId ?? state.session?.user?.memberships?.[0]?.workspaceId ?? ""
  );
}

export function useSegments(workspaceId: string) {
  const token = useAccessToken();
  return useQuery({
    queryKey: ["segments", workspaceId, token],
    queryFn: () =>
      fetchBackendJson<{ data: { items: Segment[] }; meta: { total: number } }>(
        `/api/v1/segments?workspaceId=${workspaceId}`,
        { method: "GET", headers: getWorkspaceAuthHeaders(workspaceId, token) }
      ).then((r) => r.data),
    enabled: !!workspaceId && !!token,
  });
}

export function useSegment(segmentId: string, workspaceId?: string) {
  const token = useAccessToken();
  const sessionWorkspace = useSessionWorkspaceId();
  const ws = workspaceId || sessionWorkspace;

  return useQuery({
    queryKey: ["segment", segmentId, ws, token],
    queryFn: () =>
      fetchBackendJson<{ data: Segment }>(
        `/api/v1/segments/${segmentId}?workspaceId=${encodeURIComponent(ws)}`,
        { method: "GET", headers: getWorkspaceAuthHeaders(ws, token) }
      ).then((r) => r.data),
    enabled: !!segmentId && !!ws && !!token,
  });
}

export function useSegmentMembers(segmentId: string, page = 1, limit = 25, workspaceId?: string) {
  const token = useAccessToken();
  const sessionWorkspace = useSessionWorkspaceId();
  const ws = workspaceId || sessionWorkspace;

  return useQuery({
    queryKey: ["segment-members", segmentId, page, ws, token],
    queryFn: () =>
      fetchBackendJson<{ data: { items: SegmentMember[] }; meta: { total: number; pages: number } }>(
        `/api/v1/segments/${segmentId}/members?workspaceId=${encodeURIComponent(ws)}&page=${page}&limit=${limit}`,
        { method: "GET", headers: getWorkspaceAuthHeaders(ws, token) }
      ),
    enabled: !!segmentId && !!ws && !!token,
  });
}

export function useSegmentPreview(workspaceId: string, rules: SegmentRules | null) {
  const token = useAccessToken();
  return useQuery({
    queryKey: ["segment-preview", workspaceId, JSON.stringify(rules), token],
    queryFn: () =>
      fetchBackendJson<{ data: SegmentPreview }>("/api/v1/segments/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getWorkspaceAuthHeaders(workspaceId, token) },
        body: JSON.stringify({ workspaceId, rules }),
      }).then((r) => r.data),
    enabled: !!workspaceId && !!rules && !!token,
    staleTime: 5000,
  });
}

export function useCreateSegment() {
  const qc = useQueryClient();
  const token = useAccessToken();
  return useMutation({
    mutationFn: (data: Omit<Segment, "id" | "memberCount" | "lastComputedAt" | "createdAt" | "updatedAt">) =>
      fetchBackendJson<{ data: Segment }>("/api/v1/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getWorkspaceAuthHeaders(data.workspaceId, token) },
        body: JSON.stringify(data),
      }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["segments"] }),
  });
}

export function useUpdateSegment() {
  const qc = useQueryClient();
  const token = useAccessToken();
  return useMutation({
    mutationFn: ({ id, workspaceId, ...data }: Partial<Segment> & { id: string; workspaceId?: string }) =>
      fetchBackendJson<{ data: Segment }>(`/api/v1/segments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getWorkspaceAuthHeaders(workspaceId, token) },
        body: JSON.stringify({ workspaceId, ...data }),
      }).then((r) => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["segments"] });
      qc.invalidateQueries({ queryKey: ["segment", vars.id] });
    },
  });
}

export function useDeleteSegment() {
  const qc = useQueryClient();
  const token = useAccessToken();
  return useMutation({
    mutationFn: (id: string) =>
      fetchBackendJson(`/api/v1/segments/${id}`, {
        method: "DELETE",
        headers: getWorkspaceAuthHeaders(undefined, token),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["segments"] }),
  });
}

export function useAddSegmentMember() {
  const qc = useQueryClient();
  const token = useAccessToken();
  return useMutation({
    mutationFn: ({ segmentId, leadId, workspaceId }: { segmentId: string; leadId: string; workspaceId?: string }) =>
      fetchBackendJson(`/api/v1/segments/${segmentId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getWorkspaceAuthHeaders(workspaceId, token) },
        body: JSON.stringify({ leadId, workspaceId }),
      }),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["segment-members", vars.segmentId] }),
  });
}

export function useRemoveSegmentMember() {
  const qc = useQueryClient();
  const token = useAccessToken();
  return useMutation({
    mutationFn: ({ segmentId, leadId, workspaceId }: { segmentId: string; leadId: string; workspaceId?: string }) =>
      fetchBackendJson(`/api/v1/segments/${segmentId}/members/${leadId}`, {
        method: "DELETE",
        headers: getWorkspaceAuthHeaders(workspaceId, token),
      }),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["segment-members", vars.segmentId] }),
  });
}

export function useComputeSegment() {
  const qc = useQueryClient();
  const token = useAccessToken();
  return useMutation({
    mutationFn: (segmentId: string) =>
      fetchBackendJson(`/api/v1/segments/${segmentId}/compute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getWorkspaceAuthHeaders(undefined, token) },
        body: JSON.stringify({}),
      }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["segments"] });
      qc.invalidateQueries({ queryKey: ["segment", id] });
    },
  });
}
