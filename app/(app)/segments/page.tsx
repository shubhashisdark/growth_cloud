"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Layers, Plus, RefreshCw, Users, ChevronRight, Trash2, RefreshCcw, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthSessionStore } from "@/lib/stores/auth-session";
import { useSegments, useDeleteSegment, useComputeSegment } from "@/hooks/useSegments";
import { cn } from "@/lib/utils";

function typeBadge(type: string) {
  return type === "dynamic"
    ? "bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20"
    : "bg-[#818CF8]/10 text-[#818CF8] border border-[#818CF8]/20";
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    paused: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    archived: "bg-[#1E2538] text-[#64748B] border border-white/8",
  };
  return map[status] ?? map.archived;
}

export default function SegmentsPage() {
  const router = useRouter();
  const session = useAuthSessionStore((s) => s.session);
  const workspaceId = session?.user?.memberships?.[0]?.workspaceId ?? "";

  const { data, isLoading, refetch } = useSegments(workspaceId);
  const deleteSegment = useDeleteSegment();
  const computeSegment = useComputeSegment();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [computingId, setComputingId] = useState<string | null>(null);

  const segments = data?.items ?? [];
  const dynamic = segments.filter((s) => s.type === "dynamic").length;
  const staticCount = segments.filter((s) => s.type === "static").length;
  const totalMembers = segments.reduce((a, s) => a + s.memberCount, 0);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this segment?")) return;
    setDeletingId(id);
    await deleteSegment.mutateAsync(id);
    setDeletingId(null);
  };

  const handleCompute = async (id: string) => {
    setComputingId(id);
    await computeSegment.mutateAsync(id);
    setComputingId(null);
    refetch();
  };

  return (
    <div className="min-h-screen bg-[#070A14] text-[#F1F5F9] p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#64748B] mb-1">
            <Layers className="w-3.5 h-3.5" /> Segmentation
          </div>
          <h1 className="text-2xl font-bold">Segments</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Group leads dynamically or statically for targeted campaigns</p>
        </div>
        <Button onClick={() => router.push("/segments/new")}
          className="bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#0B0F1A] font-semibold hover:opacity-90">
          <Plus className="w-4 h-4 mr-1.5" /> New Segment
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Segments", value: segments.length, icon: Layers, color: "text-[#38BDF8]" },
          { label: "Dynamic", value: dynamic, icon: RefreshCcw, color: "text-[#38BDF8]" },
          { label: "Static", value: staticCount, icon: BarChart3, color: "text-[#818CF8]" },
          { label: "Total Members", value: totalMembers.toLocaleString(), icon: Users, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/8 bg-[#0D1117] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#64748B]">{s.label}</span>
              <s.icon className={cn("w-4 h-4", s.color)} />
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </motion.div>

      {/* List */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl border border-white/8 bg-[#0D1117] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <span className="text-sm font-medium">All Segments</span>
          <button onClick={() => refetch()} className="text-[#64748B] hover:text-[#38BDF8] transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-[#64748B]">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading segments...
          </div>
        ) : segments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-[#64748B]">
            <Layers className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium text-[#F1F5F9]">No segments yet</p>
            <p className="text-sm mt-1">Create your first audience segment</p>
            <Button onClick={() => router.push("/segments/new")} className="mt-4 bg-[#1E2538] text-[#F1F5F9] border border-white/8 hover:bg-[#2B354F]">
              <Plus className="w-4 h-4 mr-1.5" /> Create Segment
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-white/8">
            {segments.map((seg) => (
              <div key={seg.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#F1F5F9] truncate">{seg.name}</div>
                  {seg.description && <div className="text-xs text-[#64748B] truncate">{seg.description}</div>}
                </div>

                <div className="hidden md:flex items-center gap-2 shrink-0">
                  <Badge className={cn("text-xs px-2 py-0.5 rounded-full font-medium", typeBadge(seg.type))}>
                    {seg.type}
                  </Badge>
                  <Badge className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusBadge(seg.status))}>
                    {seg.status}
                  </Badge>
                </div>

                <div className="hidden lg:flex items-center gap-4 text-xs text-[#64748B] shrink-0">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {seg.memberCount.toLocaleString()}</span>
                  {seg.lastComputedAt && <span>Computed {new Date(seg.lastComputedAt).toLocaleDateString()}</span>}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {seg.type === "dynamic" && (
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#64748B] hover:text-[#38BDF8]"
                      onClick={() => handleCompute(seg.id)} disabled={computingId === seg.id} title="Recompute">
                      {computingId === seg.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#64748B] hover:text-[#F87171]"
                    onClick={() => handleDelete(seg.id)} disabled={deletingId === seg.id} title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#64748B] hover:text-[#F1F5F9]"
                    onClick={() => router.push(`/segments/${seg.id}`)} title="View">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
