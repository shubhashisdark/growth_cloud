"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type WorkflowStatus = "active" | "paused" | "draft";
export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "paused";

export interface WorkflowNode {
  id: string;
  type: "trigger" | "delay" | "action" | "condition" | "end";
  label: string;
  config?: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  name: string;
  status: WorkflowStatus;
  trigger: string;
  nodes: WorkflowNode[];
  createdAt: string;
  lastRun?: string;
  runCount: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  subject: string;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  createdAt: string;
  scheduledAt?: string;
}

export interface WorkflowsState {
  workflows: Workflow[];
  campaigns: Campaign[];
  addWorkflow: (workflow: Omit<Workflow, "id" | "createdAt" | "runCount">) => void;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  removeWorkflow: (id: string) => void;
  addCampaign: (campaign: Omit<Campaign, "id" | "createdAt">) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  removeCampaign: (id: string) => void;
}

export const DEFAULT_WORKFLOWS: Workflow[] = [];
export const DEFAULT_CAMPAIGNS: Campaign[] = [];

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

export const useWorkflowsStore = create<WorkflowsState>()(
  persist(
    (set, get) => ({
      workflows: DEFAULT_WORKFLOWS,
      campaigns: DEFAULT_CAMPAIGNS,
      addWorkflow: (workflow) =>
        set((state) => ({
          workflows: [
            ...state.workflows,
            {
              ...workflow,
              id: `wf_${Math.random().toString(36).slice(2, 9)}`,
              createdAt: new Date().toISOString(),
              runCount: 0,
            },
          ],
        })),
      updateWorkflow: (id, updates) =>
        set((state) => ({
          workflows: state.workflows.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        })),
      removeWorkflow: (id) =>
        set((state) => ({
          workflows: state.workflows.filter((w) => w.id !== id),
        })),
      addCampaign: (campaign) =>
        set((state) => ({
          campaigns: [
            ...state.campaigns,
            {
              ...campaign,
              id: `camp_${Math.random().toString(36).slice(2, 9)}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      updateCampaign: (id, updates) =>
        set((state) => ({
          campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      removeCampaign: (id) =>
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== id),
        })),
    }),
    {
      name: "gc-workflows",
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
