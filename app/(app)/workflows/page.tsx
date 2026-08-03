"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Zap, Plus, Play, Pause, Trash2, ChevronRight, Activity,
  CheckCircle2, XCircle, Clock, AlertCircle, BarChart3, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthSessionStore } from "@/lib/stores/auth-session";
import { useWorkflows, useUpdateWorkflow, useDeleteWorkflow, useTriggerWorkflow } from "@/hooks/useWorkflows";
import { cn } from "@/lib/utils";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    paused: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    archived: "bg-[#1E2538] text-[#64748B] border border-white/8",
  };
  return map[status] ?? map.paused;
}

function runStatusIcon(status: string) {
  const map: Record<string, React.ReactNode> = {
    active: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    paused: <Pause className="w-4 h-4 text-yellow-400" />,
    archived: <Clock className="w-4 h-4 text-[#64748B]" />,
  };
  return map[status] ?? <AlertCircle className="w-4 h-4 text-[#F87171]" />;
}

const TRIGGER_LABELS: Record<string, string> = {
  lead_created: "Lead Created",
  lead_updated: "Lead Updated",
  score_changed: "Score Changed",
  stage_changed: "Stage Changed",
  tag_added: "Tag Added",
  manual_trigger: "Manual",
  form_submitted: "Form Submitted",
  email_opened: "Email Opened",
  email_clicked: "Email Clicked",
};

export default function WorkflowsPage() {
  const router = useRouter();
  const session = useAuthSessionStore((s) => s.session);
  const workspaceId = session?.user?.memberships?.[0]?.workspaceId ?? "";

  const { data, isLoading, refetch } = useWorkflows(workspaceId);
  const updateWorkflow = useUpdateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();
  const triggerWorkflow = useTriggerWorkflow();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  const workflows = data?.items ?? [];
  const total = workflows.length;
  const active = workflows.filter((w) => w.status === "active").length;
  const totalRuns = workflows.reduce((a, w) => a + w.runCount, 0);
  const totalErrors = workflows.reduce((a, w) => a + w.errorCount, 0);

  const handleToggle = async (wf: (typeof workflows)[0]) => {
    setTogglingId(wf.id);
    await updateWorkflow.mutateAsync({ id: wf.id, workspaceId, status: wf.status === "active" ? "paused" : "active" });
    setTogglingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this workflow?")) return;
    setDeletingId(id);
    await deleteWorkflow.mutateAsync(id);
    setDeletingId(null);
  };

  const handleTrigger = async (id: string) => {
    setTriggeringId(id);
    await triggerWorkflow.mutateAsync({ workflowId: id, workspaceId });
    setTriggeringId(null);
    refetch();
  };

  return (
    <div className="min-h-screen bg-[#070A14] text-[#F1F5F9] p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#64748B] mb-1">
            <Zap className="w-3.5 h-3.5" /> Automation
          </div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Workflows</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Automate lead journeys with triggers, conditions, and actions</p>
        </div>
        <Button
          onClick={() => router.push("/workflows/new")}
          className="bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#0B0F1A] font-semibold hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-1.5" /> New Workflow
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Workflows", value: total, icon: Zap, color: "text-[#38BDF8]" },
          { label: "Active", value: active, icon: Activity, color: "text-emerald-400" },
          { label: "Total Runs", value: totalRuns, icon: BarChart3, color: "text-[#818CF8]" },
          { label: "Errors", value: totalErrors, icon: XCircle, color: "text-[#F87171]" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/8 bg-[#0D1117] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#64748B]">{s.label}</span>
              <s.icon className={cn("w-4 h-4", s.color)} />
            </div>
            <div className="text-2xl font-bold text-[#F1F5F9]">{s.value}</div>
          </div>
        ))}
      </motion.div>

      {/* Workflow list */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl border border-white/8 bg-[#0D1117] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <span className="text-sm font-medium text-[#F1F5F9]">All Workflows</span>
          <button onClick={() => refetch()} className="text-[#64748B] hover:text-[#38BDF8] transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-[#64748B]">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading workflows...
          </div>
        ) : workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-[#64748B]">
            <Zap className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium text-[#F1F5F9]">No workflows yet</p>
            <p className="text-sm mt-1">Create your first automation workflow</p>
            <Button onClick={() => router.push("/workflows/new")} className="mt-4 bg-[#1E2538] text-[#F1F5F9] border border-white/8 hover:bg-[#2B354F]">
              <Plus className="w-4 h-4 mr-1.5" /> Create Workflow
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-white/8">
            {workflows.map((wf) => (
              <div key={wf.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {runStatusIcon(wf.status)}
                  <div className="min-w-0">
                    <div className="font-medium text-[#F1F5F9] truncate">{wf.name}</div>
                    {wf.description && <div className="text-xs text-[#64748B] truncate">{wf.description}</div>}
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-2 shrink-0">
                  <Badge className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusBadge(wf.status))}>
                    {wf.status}
                  </Badge>
                  <span className="text-xs text-[#64748B] bg-[#0B0F1A] border border-white/8 px-2 py-1 rounded-lg">
                    {TRIGGER_LABELS[wf.triggerType] ?? wf.triggerType}
                  </span>
                </div>

                <div className="hidden lg:flex items-center gap-4 text-xs text-[#64748B] shrink-0">
                  <span>{wf.stepCount} step{wf.stepCount !== 1 ? "s" : ""}</span>
                  <span className="text-emerald-400">{wf.runCount} runs</span>
                  {wf.errorCount > 0 && <span className="text-[#F87171]">{wf.errorCount} err</span>}
                  {wf.lastRunAt && <span>Last: {new Date(wf.lastRunAt).toLocaleDateString()}</span>}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button size="sm" variant="ghost"
                    className="h-7 w-7 p-0 text-[#64748B] hover:text-[#38BDF8]"
                    onClick={() => handleTrigger(wf.id)}
                    disabled={triggeringId === wf.id}
                    title="Manual trigger"
                  >
                    {triggeringId === wf.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  </Button>
                  <Button size="sm" variant="ghost"
                    className="h-7 w-7 p-0 text-[#64748B] hover:text-yellow-400"
                    onClick={() => handleToggle(wf)}
                    disabled={togglingId === wf.id}
                    title={wf.status === "active" ? "Pause" : "Activate"}
                  >
                    {togglingId === wf.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Pause className="w-3.5 h-3.5" />}
                  </Button>
                  <Button size="sm" variant="ghost"
                    className="h-7 w-7 p-0 text-[#64748B] hover:text-[#F87171]"
                    onClick={() => handleDelete(wf.id)}
                    disabled={deletingId === wf.id}
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost"
                    className="h-7 w-7 p-0 text-[#64748B] hover:text-[#F1F5F9]"
                    onClick={() => router.push(`/workflows/${wf.id}`)}
                    title="View details"
                  >
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
