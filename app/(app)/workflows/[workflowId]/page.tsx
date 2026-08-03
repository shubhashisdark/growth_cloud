"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Zap, ArrowLeft, RefreshCw, Play, CheckCircle2, XCircle, Clock,
  ChevronRight, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkflow, useWorkflowRuns, useTriggerWorkflow, useWorkflowRunDetail } from "@/hooks/useWorkflows";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  failed: "bg-red-500/10 text-[#F87171] border border-red-500/20",
  running: "bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20",
  cancelled: "bg-[#1E2538] text-[#64748B] border border-white/8",
};

const stepStatusColors: Record<string, string> = {
  completed: "text-emerald-400",
  failed: "text-[#F87171]",
};

function StepLogItem({ log }: { log: { stepType: string; status: string; durationMs: number | null; errorMessage: string | null; input: Record<string, unknown>; output: Record<string, unknown> } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/6 last:border-0">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors text-left">
        <span className={cn("text-xs font-medium", stepStatusColors[log.status] ?? "text-[#64748B]")}>
          {log.status === "completed" ? <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> : <XCircle className="w-3.5 h-3.5 inline mr-1" />}
          {log.stepType}
        </span>
        <span className="text-xs text-[#64748B] ml-auto">{log.durationMs != null ? `${log.durationMs}ms` : "-"}</span>
        <ChevronRight className={cn("w-3.5 h-3.5 text-[#64748B] transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {log.errorMessage && <p className="text-xs text-[#F87171]">{log.errorMessage}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-[#64748B] mb-1">Input</div>
              <pre className="text-xs bg-[#0B0F1A] rounded-lg p-2 text-[#94A3B8] overflow-auto max-h-24">{JSON.stringify(log.input, null, 2)}</pre>
            </div>
            <div>
              <div className="text-xs text-[#64748B] mb-1">Output</div>
              <pre className="text-xs bg-[#0B0F1A] rounded-lg p-2 text-[#94A3B8] overflow-auto max-h-24">{JSON.stringify(log.output, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowDetailPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = use(params);
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);

  const { data: workflow, isLoading: wfLoading } = useWorkflow(workflowId);
  const { data: runsData, isLoading: runsLoading, refetch } = useWorkflowRuns(workflowId, page);
  const triggerWorkflow = useTriggerWorkflow();

  const runs = runsData?.data?.items ?? [];
  const runsMeta = runsData?.meta;

  const handleTrigger = async () => {
    await triggerWorkflow.mutateAsync({ workflowId });
    refetch();
  };

  if (wfLoading) {
    return (
      <div className="min-h-screen bg-[#070A14] flex items-center justify-center text-[#64748B]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading workflow...
      </div>
    );
  }

  if (!workflow) return null;

  const definition = workflow.definition;
  const steps = definition.steps ?? [];

  return (
    <div className="min-h-screen bg-[#070A14] text-[#F1F5F9] p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-[#64748B] hover:text-[#F1F5F9] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="text-xs text-[#64748B] uppercase tracking-widest font-semibold mb-0.5">Workflow</div>
          <h1 className="text-xl font-bold">{workflow.name}</h1>
          {workflow.description && <p className="text-sm text-[#64748B]">{workflow.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-xs px-2 py-0.5 rounded-full", statusColors[workflow.status] ?? "bg-[#1E2538] text-[#64748B]")}>
            {workflow.status}
          </Badge>
          <Button onClick={handleTrigger} disabled={triggerWorkflow.isPending}
            className="bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20 hover:bg-[#38BDF8]/20 h-8 px-3 text-xs">
            {triggerWorkflow.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
            Test Run
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: definition */}
        <div className="lg:col-span-1 space-y-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-2xl border border-white/8 bg-[#0D1117] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#F1F5F9]">Workflow Definition</h2>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Runs", value: workflow.runCount, color: "text-[#38BDF8]" },
                { label: "Errors", value: workflow.errorCount, color: "text-[#F87171]" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-[#070A14] border border-white/6 p-3 text-center">
                  <div className={cn("text-xl font-bold", s.color)}>{s.value}</div>
                  <div className="text-xs text-[#64748B]">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Trigger */}
            <div className="rounded-xl border border-[#38BDF8]/20 bg-[#38BDF8]/5 p-3">
              <div className="flex items-center gap-2 text-[#38BDF8]">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-widest">Trigger</span>
              </div>
              <div className="text-sm text-[#F1F5F9] mt-1 font-medium">{definition.trigger.type}</div>
            </div>

            {/* Steps */}
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-white/6 bg-[#070A14] p-3">
                  <span className="text-xs font-mono text-[#64748B] shrink-0 mt-0.5">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-[#F1F5F9]">
                      {step.type === "action" ? step.actionType : step.type}
                    </div>
                    {step.type === "condition" && (
                      <div className="text-xs text-[#64748B]">
                        {step.conditionField} {step.conditionOperator} {String(step.conditionValue)}
                      </div>
                    )}
                    {step.type === "delay" && (
                      <div className="text-xs text-[#64748B]">{step.delayMinutes} min</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {workflow.lastRunAt && (
              <p className="text-xs text-[#64748B]">Last run: {new Date(workflow.lastRunAt).toLocaleString()}</p>
            )}
          </motion.div>
        </div>

        {/* Right: run history */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/8 bg-[#0D1117] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#64748B]" />
                <span className="text-sm font-medium">Run History</span>
                {runsMeta && <span className="text-xs text-[#64748B]">({runsMeta.total} total)</span>}
              </div>
              <button onClick={() => refetch()} className="text-[#64748B] hover:text-[#38BDF8] transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {runsLoading ? (
              <div className="flex items-center justify-center py-12 text-[#64748B]">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading runs...
              </div>
            ) : runs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#64748B] text-center">
                <Clock className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm font-medium text-[#F1F5F9]">No runs yet</p>
                <p className="text-xs mt-1">Trigger a manual run to see execution history</p>
              </div>
            ) : (
              <div className="divide-y divide-white/6">
                {runs.map((run) => (
                  <div key={run.id}>
                    <button onClick={() => setSelectedRun(selectedRun === run.id ? null : run.id)}
                      className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-white/3 transition-colors text-left">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium",
                        statusColors[run.status] ?? "bg-[#1E2538] text-[#64748B]")}>
                        {run.status}
                      </span>
                      <span className="text-sm text-[#F1F5F9] flex-1">{run.triggerEvent}</span>
                      <span className="text-xs text-[#64748B]">
                        {run.durationMs != null ? `${run.durationMs}ms` : "—"}
                      </span>
                      <span className="text-xs text-[#64748B]">{new Date(run.startedAt).toLocaleString()}</span>
                      <ChevronRight className={cn("w-3.5 h-3.5 text-[#64748B] transition-transform", selectedRun === run.id && "rotate-90")} />
                    </button>

                    {selectedRun === run.id && (
                      <div className="bg-[#070A14] border-t border-white/6 px-6 py-4 space-y-2">
                        {run.errorMessage && <p className="text-xs text-[#F87171] mb-2">{run.errorMessage}</p>}
                        <RunStepLogs workflowId={workflowId} runId={run.id} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {runsMeta && runsMeta.pages > 1 && (
              <div className="flex justify-center gap-2 px-6 py-4 border-t border-white/8">
                <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                  className="text-[#64748B] hover:text-[#F1F5F9] text-xs">Prev</Button>
                <span className="text-xs text-[#64748B] self-center">Page {page}/{runsMeta.pages}</span>
                <Button size="sm" variant="ghost" disabled={page >= runsMeta.pages} onClick={() => setPage((p) => p + 1)}
                  className="text-[#64748B] hover:text-[#F1F5F9] text-xs">Next</Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function RunStepLogs({ workflowId, runId }: { workflowId: string; runId: string }) {
  const { data: runDetail, isLoading } = useWorkflowRunDetail(workflowId, runId);
  if (isLoading) return <p className="text-xs text-[#64748B]">Loading steps...</p>;
  if (!runDetail) return null;
  return (
    <div className="rounded-xl border border-white/8 bg-[#0D1117] overflow-hidden">
      {runDetail.stepLogs.map((log: any, i: number) => (
        <StepLogItem key={i} log={log} />
      ))}
    </div>
  );
}
