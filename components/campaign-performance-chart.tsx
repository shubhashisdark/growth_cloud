"use client";

import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { Campaign } from "@/lib/stores/workflows";

interface CampaignPerformanceChartProps {
  campaigns: Campaign[];
}

interface DataPoint {
  month: string;
  opens: number;
  clicks: number;
  conversions: number;
}

function aggregateByMonth(campaigns: Campaign[]): DataPoint[] {
  const map: Record<string, { opens: number; clicks: number; conversions: number }> = {};

  for (const c of campaigns) {
    if (c.sent === 0) continue;
    const date = new Date(c.createdAt);
    const key = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

    if (!map[key]) map[key] = { opens: 0, clicks: 0, conversions: 0 };
    map[key].opens += c.opened;
    map[key].clicks += c.clicked;
    // estimated conversions from clicks
    map[key].conversions += Math.round(c.clicked * 0.15);
  }

  const months = Object.entries(map).map(([month, vals]) => ({
    month,
    ...vals,
  }));

  // Sort by chronological order
  months.sort((a, b) => {
    const da = new Date(a.month + " 1");
    const db = new Date(b.month + " 1");
    return da.getTime() - db.getTime();
  });

  return months;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111827] border border-white/[0.08] rounded-lg px-3 py-2 text-xs shadow-lg">
        <div className="text-[#F1F5F9] font-semibold mb-1">{label}</div>
        {payload.map((p) => (
          <div key={p.name} style={{ color: p.color }} className="font-medium">
            {p.name}: {p.value.toLocaleString()}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function CampaignPerformanceChart({ campaigns }: CampaignPerformanceChartProps) {
  const data = React.useMemo(() => aggregateByMonth(campaigns), [campaigns]);

  return (
    <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6">
      <div className="mb-6">
        <div className="text-base font-semibold text-[#F1F5F9]">Campaign Performance</div>
        <div className="text-[13px] text-[#64748B] mt-0.5">Opens, clicks, and conversions over time</div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              formatter={(value: string) => <span className="text-[#94A3B8]">{value}</span>}
            />
            <Line
              type="monotone"
              dataKey="opens"
              name="Opens"
              stroke="#38BDF8"
              strokeWidth={2}
              dot={{ r: 3, fill: "#38BDF8" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="clicks"
              name="Clicks"
              stroke="#34D399"
              strokeWidth={2}
              dot={{ r: 3, fill: "#34D399" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="conversions"
              name="Conversions"
              stroke="#FBBF24"
              strokeWidth={2}
              dot={{ r: 3, fill: "#FBBF24" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
