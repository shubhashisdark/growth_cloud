"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type LeadStage = "Subscriber" | "MQL" | "SQL" | "Customer";

export interface LeadActivity {
  type: string;
  description: string;
  timestamp: string;
}

export interface LeadAttribution {
  touchpoint: string;
  channel: string;
  date: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  stage: LeadStage;
  score: number;
  segments: string[];
  source: string;
  lastActive: string;
  createdAt: string;
  activities: LeadActivity[];
  attribution: LeadAttribution[];
}

export interface LeadsState {
  leads: Lead[];
  addLead: (lead: Omit<Lead, "id" | "createdAt">) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  removeLead: (id: string) => void;
  getLeadById: (id: string) => Lead | undefined;
}

export const DEFAULT_LEADS: Lead[] = [];

export interface LeadInsight {
  summary: string;
  probability: number;
}

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

export const useLeadsStore = create<LeadsState>()(
  persist(
    (set, get) => ({
      leads: DEFAULT_LEADS,
      addLead: (lead) =>
        set((state) => ({
          leads: [
            ...state.leads,
            {
              ...lead,
              id: `lead_${Math.random().toString(36).slice(2, 9)}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      updateLead: (id, updates) =>
        set((state) => ({
          leads: state.leads.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead)),
        })),
      removeLead: (id) =>
        set((state) => ({
          leads: state.leads.filter((lead) => lead.id !== id),
        })),
      getLeadById: (id) => get().leads.find((lead) => lead.id === id),
    }),
    {
      name: "gc-leads",
      storage: createJSONStorage(() => safeStorage),
    }
  )
);

export function aiSummary(lead: Lead): LeadInsight {
  const probability = Math.max(5, Math.min(95, Math.round(lead.score * 0.9)));

  return {
    summary: `${lead.name} is a ${lead.stage} lead from ${lead.source} with ${lead.score} score. Next best action: review ${lead.segments.length > 0 ? lead.segments.join(", ") : "their engagement signals"}.`,
    probability,
  };
}
