"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, Users, Mail, Zap, Download, RefreshCw, Sparkles,
  Calendar, CheckCircle2, AlertTriangle, Info, ArrowUpRight, Award, PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthSessionStore } from "@/lib/stores/auth-session";
import { useAnalyticsOverview, downloadAnalyticsExport, type DateRange } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";

const DATE_RANGES: Array<{ label: string; value: DateRange }> = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "12 Months", value: "12m" },
  { label: "All Time", value: "all" },
];

export default function AnalyticsPage() {
  const session = useAuthSessionStore((s) => s.session);
  const workspaceId = session?.user?.memberships?.[0]?.workspaceId ?? "";

  const [range, setRange] = useState<DateRange>("30d");
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, refetch } = useAnalyticsOverview(workspaceId, range);

  const handleExport = async (format: "csv" | "json") => {
    setExporting(true);
    try {
      await downloadAnalyticsExport(workspaceId, format, range);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  const leadMetrics = data?.leadMetrics;
  const campaignMetrics = data?.campaignMetrics;
  const workflowMetrics = data?.workflowMetrics;
  const timeseries = data?.timeseries ?? [];
  const aiInsights = data?.aiInsights ?? [];

  // Max value calculation for bar rendering
  const maxLeadsInTimeseries = Math.max(1, ...timeseries.map((t) => t.leads));

  return (
    <div className="min-h-screen bg-[#070A14] text-[#F1F5F9] p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#64748B] mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-[#38BDF8]" /> Growth Intelligence
          </div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Real-time performance metrics across leads, campaigns, and workflows</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range picker */}
          <div className="flex items-center rounded-xl border border-white/8 bg-[#0D1117] p-1 text-xs">
            {DATE_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all font-medium",
                  range === r.value
                    ? "bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20"
                    : "text-[#64748B] hover:text-[#F1F5F9]"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <Button
            onClick={() => handleExport("csv")}
            disabled={exporting || isLoading}
            className="bg-[#1E2538] text-[#F1F5F9] border border-white/8 hover:bg-[#2B354F] h-9 text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> CSV Export
          </Button>

          <Button
            onClick={() => refetch()}
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-[#64748B] hover:text-[#38BDF8]"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </motion.div>

      {/* Primary KPI Cards */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: leadMetrics?.totalLeads ?? 0, sub: `+${leadMetrics?.periodLeads ?? 0} in period`, icon: Users, color: "text-[#38BDF8]" },
          { label: "Lead Conversion Rate", value: `${leadMetrics?.conversionRate ?? 0}%`, sub: "Customer conversion", icon: TrendingUp, color: "text-emerald-400" },
          { label: "Email Open Rate", value: `${campaignMetrics?.emailOpenRate ?? 0}%`, sub: `${campaignMetrics?.totalSent ?? 0} total sent`, icon: Mail, color: "text-[#818CF8]" },
          { label: "Workflow Success", value: `${workflowMetrics?.workflowSuccessRate ?? 100}%`, sub: `${workflowMetrics?.totalWorkflowRuns ?? 0} total runs`, icon: Zap, color: "text-yellow-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-white/8 bg-[#0D1117] p-5 relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#64748B]">{kpi.label}</span>
              <div className="p-2 rounded-xl bg-[#070A14] border border-white/6">
                <kpi.icon className={cn("w-4 h-4", kpi.color)} />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#F1F5F9] mb-1">{isLoading ? "..." : kpi.value}</div>
            <div className="text-xs text-[#64748B]">{kpi.sub}</div>
          </div>
        ))}
      </motion.div>

      {/* Main Charts & Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Growth Trend Chart */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 rounded-2xl border border-white/8 bg-[#0D1117] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#F1F5F9]">Lead Acquisition & Email Activity</h2>
              <p className="text-xs text-[#64748B]">Trend timeline for period ({range})</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-[#38BDF8]"><div className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" /> Leads</span>
              <span className="flex items-center gap-1.5 text-[#818CF8]"><div className="w-2.5 h-2.5 rounded-full bg-[#818CF8]" /> Emails</span>
            </div>
          </div>

          <div className="h-48 flex items-end gap-2 pt-6 border-b border-white/8">
            {timeseries.map((t, i) => {
              const heightPct = Math.max(8, Math.round((t.leads / maxLeadsInTimeseries) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#070A14] border border-white/10 text-xs px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-10">
                    {t.date}: {t.leads} leads, {t.emailsSent} emails
                  </div>
                  <div className="w-full flex items-end justify-center gap-1 h-36">
                    <div className="w-1.5 rounded-t bg-[#38BDF8] transition-all group-hover:opacity-80" style={{ height: `${heightPct}%` }} />
                    <div className="w-1.5 rounded-t bg-[#818CF8]/50 transition-all group-hover:opacity-80" style={{ height: `${Math.min(100, Math.max(5, heightPct * 0.7))}%` }} />
                  </div>
                  <span className="text-[10px] text-[#64748B] truncate w-full text-center">{t.date.split("-").slice(1).join("/")}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* AI Insights Card */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-2xl border border-[#818CF8]/20 bg-[#818CF8]/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#818CF8]">
              <Sparkles className="w-4 h-4" />
              <h2 className="text-sm font-semibold">AI Marketing Insights</h2>
            </div>
            <Badge className="bg-[#818CF8]/10 text-[#818CF8] border-[#818CF8]/20 text-[10px]">Real-time</Badge>
          </div>

          <div className="space-y-3">
            {aiInsights.length === 0 ? (
              <p className="text-xs text-[#64748B]">Collecting workspace telemetry to generate AI recommendations...</p>
            ) : (
              aiInsights.map((insight, idx) => (
                <div key={idx} className="rounded-xl border border-white/8 bg-[#0D1117] p-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 font-medium">
                    {insight.type === "positive" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    {insight.type === "warning" && <AlertTriangle className="w-3.5 h-3.5 text-[#F87171] shrink-0" />}
                    {insight.type === "info" && <Info className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />}
                    <span className="text-[#F1F5F9]">{insight.title}</span>
                  </div>
                  <p className="text-[#94A3B8] leading-relaxed">{insight.description}</p>
                  <div className="text-[11px] text-[#38BDF8] font-medium pt-1 border-t border-white/6 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" /> {insight.recommendation}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lifecycle Breakdown */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="rounded-2xl border border-white/8 bg-[#0D1117] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F1F5F9]">Lifecycle Stage Distribution</h2>
            <PieChart className="w-4 h-4 text-[#64748B]" />
          </div>

          <div className="space-y-3">
            {[
              { stage: "Subscribers", count: leadMetrics?.lifecycle.subscriber ?? 0, color: "bg-[#1E2538] text-[#94A3B8]" },
              { stage: "Leads", count: leadMetrics?.lifecycle.lead ?? 0, color: "bg-[#38BDF8]" },
              { stage: "MQLs", count: leadMetrics?.lifecycle.mql ?? 0, color: "bg-[#818CF8]" },
              { stage: "SQLs", count: leadMetrics?.lifecycle.sql ?? 0, color: "bg-yellow-400" },
              { stage: "Customers", count: leadMetrics?.lifecycle.customer ?? 0, color: "bg-emerald-400" },
            ].map((st) => {
              const pct = (leadMetrics?.totalLeads ?? 0) > 0 ? Math.round((st.count / (leadMetrics?.totalLeads ?? 1)) * 100) : 0;
              return (
                <div key={st.stage} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#64748B]">{st.stage}</span>
                    <span className="font-medium text-[#F1F5F9]">{st.count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", st.color)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Lead Sources */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="rounded-2xl border border-white/8 bg-[#0D1117] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F1F5F9]">Lead Acquisition Sources</h2>
            <Users className="w-4 h-4 text-[#64748B]" />
          </div>

          <div className="space-y-3">
            {(leadMetrics?.sources ?? []).length === 0 ? (
              <p className="text-xs text-[#64748B]">No sources captured yet</p>
            ) : (
              (leadMetrics?.sources ?? []).map((src) => (
                <div key={src.source} className="flex items-center justify-between text-xs p-2.5 rounded-xl border border-white/6 bg-[#070A14]">
                  <span className="font-medium text-[#F1F5F9] capitalize">{src.source}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#64748B]">{src.count} leads</span>
                    <Badge className="bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/20 text-[10px]">{src.percentage}%</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Score Histogram */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="rounded-2xl border border-white/8 bg-[#0D1117] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F1F5F9]">Lead Score Distribution</h2>
            <Award className="w-4 h-4 text-[#64748B]" />
          </div>

          <div className="space-y-3">
            {Object.entries(leadMetrics?.scoreDistribution ?? {}).map(([rangeBucket, count]) => {
              const total = leadMetrics?.totalLeads ?? 1;
              const pct = Math.round(((count as number) / (total > 0 ? total : 1)) * 100);
              const barColor = rangeBucket === "81-100" ? "bg-emerald-400" : rangeBucket === "61-80" ? "bg-[#38BDF8]" : rangeBucket === "41-60" ? "bg-yellow-400" : "bg-[#F87171]";
              return (
                <div key={rangeBucket} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#64748B]">Score {rangeBucket}</span>
                    <span className="font-medium text-[#F1F5F9]">{count as number} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
