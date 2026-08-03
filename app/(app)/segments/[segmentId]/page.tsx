"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Layers, ArrowLeft, Users, RefreshCw, RefreshCcw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSegment, useSegmentMembers, useComputeSegment } from "@/hooks/useSegments";
import { cn } from "@/lib/utils";

const stageColors: Record<string, string> = {
  subscriber: "bg-[#1E2538] text-[#94A3B8]",
  lead: "bg-[#38BDF8]/10 text-[#38BDF8]",
  mql: "bg-[#818CF8]/10 text-[#818CF8]",
  sql: "bg-yellow-500/10 text-yellow-400",
  customer: "bg-emerald-500/10 text-emerald-400",
};

function scoreBar(score: number) {
  const color = score >= 80 ? "#34D399" : score >= 50 ? "#38BDF8" : score >= 25 ? "#FBBF24" : "#F87171";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-[#94A3B8]">{score}</span>
    </div>
  );
}

export default function SegmentDetailPage({ params }: { params: Promise<{ segmentId: string }> }) {
  const { segmentId } = use(params);
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data: segment, isLoading: segLoading } = useSegment(segmentId);
  const { data: membersData, isLoading: membersLoading, refetch } = useSegmentMembers(segmentId, page);
  const computeSegment = useComputeSegment();

  const members = membersData?.data?.items ?? [];
  const meta = membersData?.meta;

  const handleCompute = async () => {
    await computeSegment.mutateAsync(segmentId);
    refetch();
  };

  if (segLoading) {
    return (
      <div className="min-h-screen bg-[#070A14] flex items-center justify-center text-[#64748B]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading segment...
      </div>
    );
  }

  if (!segment) return null;

  const rules = segment.rules;
  const conditions = rules.conditions ?? [];

  return (
    <div className="min-h-screen bg-[#070A14] text-[#F1F5F9] p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-[#64748B] hover:text-[#F1F5F9] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="text-xs text-[#64748B] uppercase tracking-widest font-semibold mb-0.5">Segment</div>
          <h1 className="text-xl font-bold">{segment.name}</h1>
          {segment.description && <p className="text-sm text-[#64748B]">{segment.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-xs px-2 py-0.5 rounded-full border font-medium",
            segment.type === "dynamic"
              ? "bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/20"
              : "bg-[#818CF8]/10 text-[#818CF8] border-[#818CF8]/20")}>
            {segment.type}
          </Badge>
          {segment.type === "dynamic" && (
            <Button onClick={handleCompute} disabled={computeSegment.isPending}
              className="bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20 hover:bg-[#38BDF8]/20 h-8 px-3 text-xs">
              {computeSegment.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCcw className="w-3.5 h-3.5 mr-1" />}
              Recompute
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: info */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-2xl border border-white/8 bg-[#0D1117] p-5 space-y-4">
            <h2 className="text-sm font-semibold">Overview</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#64748B]">Members</span>
                <span className="font-semibold text-[#38BDF8]">{segment.memberCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#64748B]">Logic</span>
                <span className="font-mono text-xs text-[#818CF8]">{rules.logic}</span>
              </div>
              {segment.lastComputedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#64748B]">Last Computed</span>
                  <span className="text-xs">{new Date(segment.lastComputedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </motion.div>

          {conditions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="rounded-2xl border border-white/8 bg-[#0D1117] p-5 space-y-3">
              <h2 className="text-sm font-semibold">Filter Rules</h2>
              {conditions.map((c, i) => (
                <div key={i} className="rounded-xl bg-[#070A14] border border-white/6 p-3 text-xs space-y-1">
                  <span className="text-[#64748B] font-mono">{i === 0 ? "IF" : rules.logic}</span>
                  <div className="text-[#F1F5F9]">
                    <span className="text-[#38BDF8]">{c.field}</span>
                    {" "}<span className="text-[#818CF8]">{c.operator}</span>
                    {" "}<span className="text-yellow-400">{String(c.value)}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Right: members */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/8 bg-[#0D1117] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#64748B]" />
                <span className="text-sm font-medium">Members</span>
                {meta && <span className="text-xs text-[#64748B]">({meta.total} total)</span>}
              </div>
              <button onClick={() => refetch()} className="text-[#64748B] hover:text-[#38BDF8] transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {membersLoading ? (
              <div className="flex items-center justify-center py-12 text-[#64748B]">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading members...
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#64748B] text-center">
                <Users className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm font-medium text-[#F1F5F9]">No members</p>
                <p className="text-xs mt-1">
                  {segment.type === "dynamic" ? "Click Recompute to populate this segment" : "Add leads to this static segment"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/6">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/3 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#F1F5F9] text-sm">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-xs text-[#64748B] truncate">{member.email}</div>
                    </div>
                    <Badge className={cn("text-xs px-2 py-0.5 rounded-full hidden md:block", stageColors[member.lifecycleStage] ?? stageColors.lead)}>
                      {member.lifecycleStage}
                    </Badge>
                    {scoreBar(member.score)}
                    {member.addedAt && (
                      <span className="text-xs text-[#64748B] hidden lg:block">{new Date(member.addedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {meta && meta.pages > 1 && (
              <div className="flex justify-center gap-2 px-6 py-4 border-t border-white/8">
                <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                  className="text-[#64748B] hover:text-[#F1F5F9] text-xs">Prev</Button>
                <span className="text-xs text-[#64748B] self-center">Page {page}/{meta.pages}</span>
                <Button size="sm" variant="ghost" disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}
                  className="text-[#64748B] hover:text-[#F1F5F9] text-xs">Next</Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
