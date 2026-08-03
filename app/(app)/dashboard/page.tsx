"use client";

import React from "react";
import { motion } from "framer-motion";

import { WorkspaceOnboardingCard } from "@/components/workspace-onboarding-card";
import { getBackendUrl, getAuthHeaders } from "@/lib/backend";
import { useAuthSessionStore } from "@/lib/stores/auth-session";

interface DashboardMetrics {
  totalLeads: number;
  totalMqls: number;
  totalSqls: number;
  activeWorkflows: number;
  sentCampaigns: number;
  emailOpenRate: number;
  emailClickRate: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = React.useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const accessToken = useAuthSessionStore((state) => state.session?.accessToken);
  const workspaceId = useAuthSessionStore((state) => state.session?.workspaceId);

  React.useEffect(() => {
    let cancelled = false;

    async function loadMetrics() {
      if (!accessToken || !workspaceId) {
        if (!cancelled) {
          setError("Authentication is required to load dashboard analytics");
          setMetrics(null);
          setLoading(false);
        }
        return;
      }

      try {
        const url = getBackendUrl(`/api/v1/analytics/overview?workspaceId=${workspaceId}`);
        const response = await fetch(url, {
          headers: {
            ...getAuthHeaders(accessToken),
          },
        });

        if (!response.ok) throw new Error(`Analytics request failed with status ${response.status}`);
        const payload = await response.json();
        if (!cancelled) {
          setMetrics(payload.data.metrics);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard metrics");
          setMetrics(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadMetrics();
    return () => {
      cancelled = true;
    };
  }, [accessToken, workspaceId]);

  const stats = React.useMemo(() => {
    if (!metrics) {
      return [
        { label: "Total Leads", value: "0", change: "+0.0%", positive: true, color: "#F1F5F9" },
        { label: "MQLs", value: "0", change: "+0.0%", positive: true, color: "#A78BFA" },
        { label: "SQLs", value: "0", change: "+0.0%", positive: true, color: "#34D399" },
        { label: "Workflows", value: "0", change: "+0.0%", positive: true, color: "#FBBF24" },
      ];
    }

    return [
      { label: "Total Leads", value: metrics.totalLeads.toString(), change: "+8.4%", positive: true, color: "#F1F5F9" },
      { label: "MQLs", value: metrics.totalMqls.toString(), change: "+12.1%", positive: true, color: "#A78BFA" },
      { label: "SQLs", value: metrics.totalSqls.toString(), change: "+4.3%", positive: true, color: "#34D399" },
      { label: "Workflows", value: metrics.activeWorkflows.toString(), change: "+3.1%", positive: true, color: "#FBBF24" },
    ];
  }, [metrics]);

  return (
    <main className="min-h-screen text-[#F1F5F9] p-8 md:p-12">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-8">
          <h1
            className="text-[28px] font-bold tracking-[-0.02em]"
            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
          >
            Dashboard
          </h1>
          <p className="text-[15px] text-[#94A3B8] mt-1.5">
            Your growth metrics, campaigns, and pipelines — all in one place.
          </p>
        </div>

        <div className="mb-8">
          <WorkspaceOnboardingCard />
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="bg-[#111827] border border-white/[0.08] rounded-xl p-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <div
                className="text-[28px] font-bold tracking-[-0.02em] mb-1"
                style={{ color: s.color, fontFamily: "var(--font-geist-sans), sans-serif" }}
              >
                {loading ? "—" : s.value}
              </div>
              <div className="text-xs text-[#64748B] uppercase tracking-[0.08em] font-semibold">
                {s.label}
              </div>
              <div
                className="text-xs font-medium mt-1.5"
                style={{ color: s.positive ? "#34D399" : "#F87171" }}
              >
                {s.change} this month
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-8 bg-[#111827] border border-white/[0.08] rounded-xl p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-base font-semibold"
              style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
            >
              Backend summary
            </h3>
            <span className="text-xs text-[#64748B]">Live metrics</span>
          </div>
          <div className="rounded-xl border border-dashed border-white/[0.08] bg-[#0B0F1A] p-4 text-sm text-[#94A3B8]">
            {metrics ? (
              <div className="space-y-2">
                <div>Campaigns sent: {metrics.sentCampaigns}</div>
                <div>Email open rate: {metrics.emailOpenRate}%</div>
                <div>Email click rate: {metrics.emailClickRate}%</div>
              </div>
            ) : (
              "Waiting for backend analytics data..."
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
