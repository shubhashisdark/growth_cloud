"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ApiKeyType = "public" | "secret";
export type ApiKeyStatus = "active" | "revoked";
export type WebhookStatus = "active" | "inactive";
export type LogStatus = "success" | "pending" | "error";

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  type: ApiKeyType;
  status: ApiKeyStatus;
  scopes: string[];
  allowedDomains?: string[];
  createdAt: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: WebhookStatus;
  secret?: string;
  createdAt: string;
}

export interface ConnectionLog {
  id: string;
  message: string;
  status: LogStatus;
  timestamp: string;
}

export interface IntegrationsState {
  apiKeys: ApiKey[];
  webhooks: Webhook[];
  connectionLogs: ConnectionLog[];
  addApiKey: (key: Omit<ApiKey, "id" | "createdAt">) => void;
  revokeApiKey: (id: string) => void;
  addWebhook: (hook: Omit<Webhook, "id" | "createdAt">) => void;
  updateWebhook: (id: string, updates: Partial<Webhook>) => void;
  removeWebhook: (id: string) => void;
  addConnectionLog: (log: Omit<ConnectionLog, "id" | "timestamp">) => void;
  clearConnectionLogs: () => void;
}

export const DEFAULT_API_KEYS: ApiKey[] = [];
export const DEFAULT_WEBHOOKS: Webhook[] = [];
export const DEFAULT_CONNECTION_LOGS: ConnectionLog[] = [];

const safeStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== "undefined") localStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    if (typeof window !== "undefined") localStorage.removeItem(name);
  },
};

export const useIntegrationsStore = create<IntegrationsState>()(
  persist(
    (set, get) => ({
      apiKeys: DEFAULT_API_KEYS,
      webhooks: DEFAULT_WEBHOOKS,
      connectionLogs: DEFAULT_CONNECTION_LOGS,
      addApiKey: (key) =>
        set((state) => ({
          apiKeys: [
            ...state.apiKeys,
            {
              ...key,
              id: `key_${Math.random().toString(36).slice(2, 9)}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      revokeApiKey: (id) =>
        set((state) => ({
          apiKeys: state.apiKeys.map((k) =>
            k.id === id ? { ...k, status: "revoked" as ApiKeyStatus } : k
          ),
        })),
      addWebhook: (hook) =>
        set((state) => ({
          webhooks: [
            ...state.webhooks,
            {
              ...hook,
              id: `wh_${Math.random().toString(36).slice(2, 9)}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      updateWebhook: (id, updates) =>
        set((state) => ({
          webhooks: state.webhooks.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        })),
      removeWebhook: (id) =>
        set((state) => ({
          webhooks: state.webhooks.filter((w) => w.id !== id),
        })),
      addConnectionLog: (log) =>
        set((state) => ({
          connectionLogs: [
            ...state.connectionLogs,
            {
              ...log,
              id: `log_${Math.random().toString(36).slice(2, 9)}`,
              timestamp: new Date().toISOString(),
            },
          ],
        })),
      clearConnectionLogs: () =>
        set(() => ({
          connectionLogs: [],
        })),
    }),
    {
      name: "gc-integrations",
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
