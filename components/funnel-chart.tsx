"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Lead, LeadStage } from "@/lib/stores/leads";

interface FunnelChartProps {
  leads: Lead[];
}

const STAGE_ORDER: LeadStage[] = ["Subscriber", "MQL", "SQL", "Customer"];

const STAGE_COLORS: Record<LeadStage, string> = {
  Subscriber: "#38BDF8",
  MQL: "#A78BFA",
  SQL: "#34D399",
  Customer: "#FBBF24",
};

function computeFunnel(leads: Lead[]) {
  return STAGE_ORDER.map((stage) => ({
    stage,
    count: leads.filter((l) => l.stage === stage).length,
  }));
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111827] border border-white/[0.08] rounded-lg px-3 py-2 text-xs shadow-lg">
        <div className="text-[#F1F5F9] font-semibold mb-1">{label}</div>
        <div className="text-[#38BDF8]">
          Leads: <span className="font-bold">{payload[0].value.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function FunnelChart({ leads }: FunnelChartProps) {
  const data = React.useMemo(() => computeFunnel(leads), [leads]);

  return (
    <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6">
      <div className="mb-6">
        <div className="text-base font-semibold text-[#F1F5F9]">Lead Funnel</div>
        <div className="text-[13px] text-[#64748B] mt-0.5">Stage progression across your pipeline</div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="stage"
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
                <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
