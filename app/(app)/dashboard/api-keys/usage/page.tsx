"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BarChart2,
  ChevronLeft,
  Key,
  Clock,
  Activity,
  Zap,
  Filter,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { useApiKeys } from "@/hooks/useApiKeys";

function formatTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "short",
      timeStyle: "medium",
      timeZone: "UTC",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function ApiUsagePage() {
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const { apiKeys, usageData, isLoadingUsage } = useApiKeys(selectedKeyId || undefined);

  const { keys, usage } = usageData;

  const totalRequests = usage.length;
  const avgLatency =
    totalRequests > 0
      ? Math.round(usage.reduce((sum, item) => sum + item.responseTimeMs, 0) / totalRequests)
      : 0;

  const errorRequests = usage.filter((item) => item.statusCode >= 400).length;
  const errorRate = totalRequests > 0 ? ((errorRequests / totalRequests) * 100).toFixed(1) : "0.0";

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/api-keys"
          className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#F1F5F9] transition-colors mb-3"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to API Keys</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9] flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-[#818CF8]" />
              <span>API Telemetry & Request Usage</span>
            </h1>
            <p className="text-sm text-[#94A3B8] mt-1">
              Inspect live request logs, status codes, latency, and endpoint performance per API key.
            </p>
          </div>

          {/* Key Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#94A3B8]" />
            <select
              value={selectedKeyId}
              onChange={(e) => setSelectedKeyId(e.target.value)}
              className="h-10 px-3 rounded-xl border border-white/8 bg-[#0B0F1A] text-[#F1F5F9] text-xs focus:outline-none focus:border-[#38BDF8]"
            >
              <option value="">All API Keys ({keys.length})</option>
              {keys.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} ({k.prefix})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-5 space-y-2">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Requests</span>
            <Activity className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9]">{totalRequests}</div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-5 space-y-2">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Keys</span>
            <Key className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9]">{keys.filter((k) => k.status === "active").length}</div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-5 space-y-2">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Latency</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9]">{avgLatency} ms</div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-5 space-y-2">
          <div className="flex items-center justify-between text-[#94A3B8]">
            <span className="text-xs font-semibold uppercase tracking-wider">Error Rate</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-[#F1F5F9]">{errorRate}%</div>
        </div>
      </div>

      {/* Usage Telemetry Table */}
      <div className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/8 pb-4">
          <h2 className="text-lg font-semibold text-[#F1F5F9]">Recent Request Logs</h2>
          <span className="text-xs text-[#94A3B8]">Showing last 50 events</span>
        </div>

        {isLoadingUsage ? (
          <div className="py-12 text-center text-[#94A3B8] flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#818CF8]" />
            <span>Loading telemetry logs...</span>
          </div>
        ) : usage.length === 0 ? (
          <div className="py-12 text-center space-y-2 text-[#94A3B8]">
            <Clock className="w-8 h-8 mx-auto text-[#64748B]" />
            <div className="text-sm font-medium text-[#F1F5F9]">No Request Telemetry Logs Yet</div>
            <p className="text-xs text-[#64748B]">API requests made with your workspace keys will be logged here in real-time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[#94A3B8] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">API Key</th>
                  <th className="pb-3 font-semibold">Method</th>
                  <th className="pb-3 font-semibold">Path</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Latency</th>
                  <th className="pb-3 font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {usage.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 text-[#94A3B8]">{formatTimestamp(log.createdAt)}</td>
                    <td className="py-3 text-[#F1F5F9] font-sans font-medium">{log.apiKeyName}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-[#38BDF8] border border-white/5 font-bold">
                        {log.method}
                      </span>
                    </td>
                    <td className="py-3 text-[#E2E8F0]">{log.path}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          log.statusCode < 300
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : log.statusCode < 500
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="py-3 text-[#CBD5E1]">{log.responseTimeMs} ms</td>
                    <td className="py-3 text-[#64748B]">{log.ipAddress || "127.0.0.1"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
