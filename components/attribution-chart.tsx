"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Lead } from "@/lib/stores/leads";
import { cn } from "@/lib/utils";

export type AttributionModel = "first" | "last" | "linear";

interface AttributionChartProps {
  leads: Lead[];
  model: AttributionModel;
  onModelChange: (model: AttributionModel) => void;
}

interface AttributionRow {
  channel: string;
  conversions: number;
}

function computeAttribution(leads: Lead[], model: AttributionModel): AttributionRow[] {
  const customers = leads.filter((l) => l.stage === "Customer");
  const channelMap: Record<string, number> = {};

  for (const lead of customers) {
    if (!lead.attribution || lead.attribution.length === 0) continue;

    const channels = lead.attribution.map((a) => a.channel);

    if (model === "first") {
      const ch = channels[0];
      if (ch) channelMap[ch] = (channelMap[ch] || 0) + 1;
    } else if (model === "last") {
      const ch = channels[channels.length - 1];
      if (ch) channelMap[ch] = (channelMap[ch] || 0) + 1;
    } else {
      // linear - split evenly across all touchpoints
      const weight = 1 / channels.length;
      for (const ch of channels) {
        channelMap[ch] = (channelMap[ch] || 0) + weight;
      }
    }
  }

  return Object.entries(channelMap)
    .map(([channel, conversions]) => ({ channel, conversions: Number(conversions.toFixed(1)) }))
    .sort((a, b) => b.conversions - a.conversions);
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111827] border border-white/[0.08] rounded-lg px-3 py-2 text-xs shadow-lg">
        <div className="text-[#F1F5F9] font-semibold mb-1">{label}</div>
        <div className="text-[#38BDF8]">
          Conversions: <span className="font-bold">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function AttributionChart({ leads, model, onModelChange }: AttributionChartProps) {
  const data = React.useMemo(() => computeAttribution(leads, model), [leads, model]);

  return (
    <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-base font-semibold text-[#F1F5F9]">Attribution by Channel</div>
          <div className="text-[13px] text-[#64748B] mt-0.5">How conversions are distributed across channels</div>
        </div>
        <div className="inline-flex bg-[#0B0F1A] border border-white/[0.08] rounded-lg p-0.5">
          {(["first", "last", "linear"] as AttributionModel[]).map((m) => (
            <button
              key={m}
              onClick={() => onModelChange(m)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                model === m
                  ? "bg-[#1A1F2E] text-[#38BDF8]"
                  : "text-[#94A3B8] hover:text-[#F1F5F9]"
              )}
            >
              {m === "first" ? "First Touch" : m === "last" ? "Last Touch" : "Linear"}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="channel"
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
              allowDecimals={model === "linear"}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar
              dataKey="conversions"
              fill="#38BDF8"
              radius={[6, 6, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
