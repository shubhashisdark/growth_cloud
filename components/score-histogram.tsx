"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Lead } from "@/lib/stores/leads";

interface ScoreHistogramProps {
  leads: Lead[];
}

interface Bin {
  range: string;
  label: string;
  count: number;
  color: string;
}

function computeHistogram(leads: Lead[]): Bin[] {
  const bins = [
    { min: 0, max: 20, range: "0–20", label: "Cold", color: "#64748B" },
    { min: 21, max: 40, range: "21–40", label: "Low", color: "#38BDF8" },
    { min: 41, max: 60, range: "41–60", label: "Warm", color: "#A78BFA" },
    { min: 61, max: 80, range: "61–80", label: "Hot", color: "#FBBF24" },
    { min: 81, max: 100, range: "81–100", label: "Very Hot", color: "#34D399" },
  ];

  return bins.map((bin) => ({
    range: bin.range,
    label: bin.label,
    count: leads.filter((l) => l.score >= bin.min && l.score <= bin.max).length,
    color: bin.color,
  }));
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: Bin }> }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-[#111827] border border-white/[0.08] rounded-lg px-3 py-2 text-xs shadow-lg">
        <div className="text-[#F1F5F9] font-semibold mb-1">{d.range}</div>
        <div className="text-[#38BDF8]">
          Leads: <span className="font-bold">{d.count}</span>
        </div>
        <div className="text-[#64748B]">{d.label}</div>
      </div>
    );
  }
  return null;
};

export function ScoreHistogram({ leads }: ScoreHistogramProps) {
  const data = React.useMemo(() => computeHistogram(leads), [leads]);

  return (
    <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6">
      <div className="mb-6">
        <div className="text-base font-semibold text-[#F1F5F9]">Lead Score Distribution</div>
        <div className="text-[13px] text-[#64748B] mt-0.5">How lead scores are distributed across buckets</div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="range"
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {data.map((entry) => (
                <Cell key={entry.range} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
