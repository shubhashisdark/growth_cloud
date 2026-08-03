"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBackendJson } from "@/lib/backend";

export type WebhookSubscription = {
  id: string;
  workspaceId: string;
  name: string;
  targetUrl: string;
  secret: string;
  events: string[];
  status: "active" | "paused" | "disabled";
  createdAt: string;
  updatedAt: string;
};

export type WebhookDeliveryLog = {
  id: string;
  subscriptionId: string;
  event: string;
  payloadJson: string;
  statusCode: number | null;
  responseBody: string | null;
  durationMs: number | null;
  attempt: number;
  status: "success" | "failed" | "pending" | "retrying";
  errorMessage: string | null;
  nextRetryAt: string | null;
  createdAt: string;
};

export function useWebhooks(workspaceId: string) {
  return useQuery({
    queryKey: ["webhooks", workspaceId],
    queryFn: () =>
      fetchBackendJson<{ data: { items: WebhookSubscription[] } }>(
        `/api/v1/webhooks?workspaceId=${workspaceId}`,
        { method: "GET" }
      ).then((r) => r.data),
    enabled: !!workspaceId,
  });
}

export function useWebhookDeliveryLogs(subscriptionId: string, page = 1) {
  return useQuery({
    queryKey: ["webhook-deliveries", subscriptionId, page],
    queryFn: () =>
      fetchBackendJson<{ data: { items: WebhookDeliveryLog[]; total: number; pages: number } }>(
        `/api/v1/webhooks/${subscriptionId}/deliveries?page=${page}&limit=20`,
        { method: "GET" }
      ).then((r) => r.data),
    enabled: !!subscriptionId,
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { workspaceId: string; name: string; targetUrl: string; events: string[] }) =>
      fetchBackendJson<{ data: WebhookSubscription }>("/api/v1/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

export function useUpdateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, workspaceId, ...data }: Partial<WebhookSubscription> & { id: string; workspaceId: string }) =>
      fetchBackendJson<{ data: WebhookSubscription }>(`/api/v1/webhooks/${id}?workspaceId=${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, workspaceId }: { id: string; workspaceId: string }) =>
      fetchBackendJson(`/api/v1/webhooks/${id}?workspaceId=${workspaceId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

export function useRotateWebhookSecret() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, workspaceId }: { id: string; workspaceId: string }) =>
      fetchBackendJson<{ data: WebhookSubscription }>(`/api/v1/webhooks/${id}/rotate-secret?workspaceId=${workspaceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

export function useReplayWebhookDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ deliveryId, workspaceId }: { deliveryId: string; workspaceId: string }) =>
      fetchBackendJson<{ data: WebhookDeliveryLog }>(`/api/v1/webhooks/deliveries/${deliveryId}/replay?workspaceId=${workspaceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhook-deliveries"] }),
  });
}

export function useTestDispatchWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, event, payload }: { workspaceId: string; event: string; payload?: Record<string, unknown> }) =>
      fetchBackendJson<{ data: { dispatchedCount: number; successCount: number } }>(`/api/v1/webhooks/test-dispatch?workspaceId=${workspaceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, payload }),
      }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhook-deliveries"] }),
  });
}
