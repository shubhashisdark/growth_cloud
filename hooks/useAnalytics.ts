"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBackendJson, getWorkspaceAuthHeaders } from "@/lib/backend";
import { useAuthSessionStore } from "@/lib/stores/auth-session";

export type DateRange = "7d" | "30d" | "90d" | "12m" | "all";

export type AnalyticsOverview = {
  range: DateRange;
  startDate: string | null;
  endDate: string;
  leadMetrics: {
    totalLeads: number;
    periodLeads: number;
    conversionRate: number;
    mqlToSqlRate: number;
    lifecycle: {
      subscriber: number;
      lead: number;
      mql: number;
      sql: number;
      customer: number;
    };
    sources: Array<{ source: string; count: number; percentage: number }>;
    scoreDistribution: Record<string, number>;
  };
  campaignMetrics: {
    totalCampaigns: number;
    totalSent: number;
    totalOpens: number;
    totalClicks: number;
    totalBounces: number;
    totalUnsubscribes: number;
    emailOpenRate: number;
    emailClickRate: number;
    bounceRate: number;
    topTemplates: Array<{ id: string; name: string; sent: number; openRate: number; clickRate: number }>;
  };
  workflowMetrics: {
    totalWorkflows: number;
    activeWorkflows: number;
    totalWorkflowRuns: number;
    totalWorkflowErrors: number;
    workflowSuccessRate: number;
  };
  timeseries: Array<{ date: string; leads: number; emailsSent: number; workflowRuns: number }>;
  aiInsights: Array<{ title: string; type: "positive" | "warning" | "info"; description: string; recommendation: string }>;
};

export function useAnalyticsOverview(workspaceId: string, range: DateRange = "30d") {
  const token = useAuthSessionStore((state) => state.session?.accessToken ?? "");

  return useQuery({
    queryKey: ["analytics-overview", workspaceId, range, token],
    queryFn: () =>
      fetchBackendJson<{ data: AnalyticsOverview }>(
        `/api/v1/analytics/overview?workspaceId=${workspaceId}&range=${range}`,
        { headers: getWorkspaceAuthHeaders(workspaceId, token) }
      ).then((r) => r.data),
    enabled: !!workspaceId && !!token,
  });
}

export async function downloadAnalyticsExport(workspaceId: string, format: "csv" | "json", range: DateRange = "30d") {
  const headers = getWorkspaceAuthHeaders(workspaceId);
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"}/api/v1/analytics/export?workspaceId=${workspaceId}&format=${format}&range=${range}`;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error("Failed to download export");

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `analytics_${workspaceId}_${range}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
