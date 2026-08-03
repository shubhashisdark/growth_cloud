"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface SegmentRuleCheck {
  score?: { gte?: number; lte?: number };
  stage?: string[];
  source?: string[];
  hasActivity?: string[];
}

export interface Segment {
  id: string;
  name: string;
  description: string;
  rules: SegmentRuleCheck;
  color: string;
  count: number;
}

export interface SegmentsState {
  segments: Segment[];
  addSegment: (segment: Omit<Segment, "id" | "count">) => void;
  updateSegment: (id: string, updates: Partial<Segment>) => void;
  removeSegment: (id: string) => void;
  evaluateSegments: (lead: {
    score: number;
    stage: string;
    source: string;
    activities?: Array<{ type: string }>;
  }) => string[];
  recomputeCounts: (leads: Array<{
    score: number;
    stage: string;
    source: string;
    activities?: Array<{ type: string }>;
  }>) => void;
}

export const DEFAULT_SEGMENTS: Segment[] = [];

function matchesRule(
  lead: {
    score: number;
    stage: string;
    source: string;
    activities?: Array<{ type: string }>;
  },
  rules: SegmentRuleCheck
): boolean {
  if (rules.score) {
    if (rules.score.gte !== undefined && lead.score < rules.score.gte) return false;
    if (rules.score.lte !== undefined && lead.score > rules.score.lte) return false;
  }
  if (rules.stage && !rules.stage.includes(lead.stage)) return false;
  if (rules.source && !rules.source.includes(lead.source)) return false;
  if (rules.hasActivity) {
    const activityTypes = lead.activities?.map((a) => a.type) ?? [];
    const hasAny = rules.hasActivity.some((t) => activityTypes.includes(t));
    if (!hasAny) return false;
  }
  return true;
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

export const useSegmentsStore = create<SegmentsState>()(
  persist(
    (set, get) => ({
      segments: DEFAULT_SEGMENTS,
      addSegment: (segment) =>
        set((state) => ({
          segments: [
            ...state.segments,
            {
              ...segment,
              id: `seg_${Math.random().toString(36).slice(2, 9)}`,
              count: 0,
            },
          ],
        })),
      updateSegment: (id, updates) =>
        set((state) => ({
          segments: state.segments.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),
      removeSegment: (id) =>
        set((state) => ({
          segments: state.segments.filter((s) => s.id !== id),
        })),
      evaluateSegments: (lead) => {
        return get()
          .segments.filter((s) => matchesRule(lead, s.rules))
          .map((s) => s.name);
      },
      recomputeCounts: (leads) => {
        set((state) => ({
          segments: state.segments.map((seg) => ({
            ...seg,
            count: leads.filter((l) => matchesRule(l, seg.rules)).length,
          })),
        }));
      },
    }),
    {
      name: "gc-segments",
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
