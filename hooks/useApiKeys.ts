"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthSessionStore } from "@/lib/stores/auth-session";
import {
  getApiKeys,
  createApiKey,
  rotateApiKey,
  revokeApiKey,
  deleteApiKey,
  getApiKeyUsage,
} from "@/lib/backend";

export function useApiKeys(selectedApiKeyId?: string) {
  const queryClient = useQueryClient();
  const session = useAuthSessionStore((state) => state.session);
  const token = session?.accessToken || "";
  const workspaceId = session?.user?.memberships?.[0]?.workspaceId || "";

  // List API Keys query
  const apiKeysQuery = useQuery({
    queryKey: ["api-keys", workspaceId, token],
    queryFn: async () => {
      const res = await getApiKeys(workspaceId, token);
      return res.data.items;
    },
    enabled: !!token && !!workspaceId,
  });

  // Get API Key Usage Telemetry query
  const apiUsageQuery = useQuery({
    queryKey: ["api-keys-usage", workspaceId, selectedApiKeyId, token],
    queryFn: async () => {
      const res = await getApiKeyUsage(workspaceId, selectedApiKeyId, token);
      return res.data;
    },
    enabled: !!token && !!workspaceId,
  });

  // Create API Key mutation
  const createApiKeyMutation = useMutation({
    mutationFn: (payload: { name: string; type: "public" | "secret"; scopes: string[]; expiresAt?: string | null }) =>
      createApiKey({ workspaceId, ...payload }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      queryClient.invalidateQueries({ queryKey: ["api-keys-usage"] });
    },
  });

  // Rotate API Key mutation
  const rotateApiKeyMutation = useMutation({
    mutationFn: (apiKeyId: string) => rotateApiKey(apiKeyId, workspaceId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      queryClient.invalidateQueries({ queryKey: ["api-keys-usage"] });
    },
  });

  // Revoke API Key mutation
  const revokeApiKeyMutation = useMutation({
    mutationFn: ({ apiKeyId, reason }: { apiKeyId: string; reason?: string }) =>
      revokeApiKey(apiKeyId, workspaceId, reason, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      queryClient.invalidateQueries({ queryKey: ["api-keys-usage"] });
    },
  });

  // Delete API Key mutation
  const deleteApiKeyMutation = useMutation({
    mutationFn: (apiKeyId: string) => deleteApiKey(apiKeyId, workspaceId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      queryClient.invalidateQueries({ queryKey: ["api-keys-usage"] });
    },
  });

  return {
    apiKeys: apiKeysQuery.data ?? [],
    usageData: apiUsageQuery.data ?? { keys: [], usage: [] },
    isLoadingKeys: apiKeysQuery.isLoading,
    isLoadingUsage: apiUsageQuery.isLoading,
    createApiKey: createApiKeyMutation.mutateAsync,
    rotateApiKey: rotateApiKeyMutation.mutateAsync,
    revokeApiKey: revokeApiKeyMutation.mutateAsync,
    deleteApiKey: deleteApiKeyMutation.mutateAsync,
  };
}
