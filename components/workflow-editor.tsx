"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkflowCanvas } from "@/components/workflow-canvas";
import { useWorkflowsStore } from "@/lib/stores/workflows";
import { type Node, type Edge } from "@xyflow/react";
import { type CustomNodeData } from "@/components/workflow-node";
import { cn } from "@/lib/utils";
import { ArrowLeft, Save, BarChart3, MailOpen, MousePointerClick, Landmark } from "lucide-react";

function AnalyticsPanel({ workflowName }: { workflowName: string }) {
  const metrics = [
    {
      label: "Open Rate",
      value: "44.4%",
      raw: "1,865 of 4,203",
      icon: MailOpen,
      color: "#38BDF8",
    },
    {
      label: "Click Rate",
      value: "9.8%",
      raw: "412 of 4,203",
      icon: MousePointerClick,
      color: "#34D399",
    },
    {
      label: "Conversion Rate",
      value: "3.2%",
      raw: "135 of 4,203",
      icon: Landmark,
      color: "#FBBF24",
    },
  ];

  return (
    <div className="w-[260px] flex flex-col border-l border-white/[0.08] bg-[#0B0F1A] shrink-0">
      <div className="px-4 py-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#38BDF8]" />
          <span className="text-sm font-semibold text-[#F1F5F9]">Analytics</span>
        </div>
        <div className="text-[11px] text-[#64748B] mt-1 truncate">{workflowName}</div>
      </div>
      <div className="flex-1 p-4 space-y-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-[#111827] border border-white/[0.08] rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <m.icon className="w-4 h-4" style={{ color: m.color }} />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                {m.label}
              </span>
            </div>
            <div
              className="text-2xl font-bold tracking-[-0.02em] mb-0.5"
              style={{ color: m.color, fontFamily: "var(--font-geist-sans), sans-serif" }}
            >
              {m.value}
            </div>
            <div className="text-[11px] text-[#64748B]">{m.raw}</div>
          </div>
        ))}

        <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-3">
            Top Performing Node
          </div>
          <div className="text-sm font-medium text-[#F1F5F9] mb-0.5">
            Welcome Email
          </div>
          <div className="text-[11px] text-[#64748B]">62.3% open rate</div>
        </div>
      </div>
    </div>
  );
}

export function WorkflowEditor({
  workflowId,
  onBack,
}: {
  workflowId?: string | null;
  onBack: () => void;
}) {
  const store = useWorkflowsStore();
  const existing = workflowId ? store.workflows.find((w) => w.id === workflowId) : null;

  const [name, setName] = React.useState(existing?.name ?? "New Workflow");

  const initialNodes: Node<CustomNodeData>[] = React.useMemo(() => {
    if (!existing) {
      return [
        {
          id: "trigger_start",
          type: "trigger",
          position: { x: 250, y: 50 },
          data: { label: "Page View", status: "idle" as const, config: { event: "page_view" } },
        },
      ];
    }
    return existing.nodes.map((n, i) => ({
      id: n.id,
      type: n.type === "action" ? "email" : n.type,
      position: { x: 250, y: 50 + i * 120 },
      data: {
        label: n.label,
        status: "idle" as const,
        config: n.config,
      },
    }));
  }, [existing]);

  const initialEdges: Edge[] = React.useMemo(() => {
    if (!existing || existing.nodes.length < 2) return [];
    const edges: Edge[] = [];
    for (let i = 0; i < existing.nodes.length - 1; i++) {
      edges.push({
        id: `e_${i}`,
        source: existing.nodes[i].id,
        target: existing.nodes[i + 1].id,
        type: "default",
        animated: true,
        style: { stroke: "#38BDF8", strokeWidth: 2 },
      });
    }
    return edges;
  }, [existing]);

  const handleSave = () => {
    if (existing) {
      store.updateWorkflow(existing.id, { name });
    } else {
      store.addWorkflow({
        name,
        status: "draft",
        trigger: "page_view",
        nodes: [],
      });
    }
    onBack();
  };

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.08] bg-[#0B0F1A]">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            className="text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 w-64 bg-transparent border-transparent text-sm font-semibold text-[#F1F5F9] px-0 focus-visible:ring-0 focus-visible:border-transparent"
          />
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border",
              existing?.status === "active"
                ? "bg-[rgba(52,211,153,0.10)] text-[#34D399] border-[rgba(52,211,153,0.2)]"
                : existing?.status === "paused"
                ? "bg-[rgba(251,191,36,0.10)] text-[#FBBF24] border-[rgba(251,191,36,0.2)]"
                : "bg-[rgba(100,116,139,0.10)] text-[#64748B] border-[rgba(100,116,139,0.2)]"
            )}
          >
            {existing?.status ?? "draft"}
          </span>
        </div>
        <Button
          onClick={handleSave}
          className="h-8 px-4 text-xs font-semibold rounded-lg text-[#0B0F1A] bg-[#38BDF8] hover:bg-[#38BDF8]/90"
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          Save
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 min-w-0">
          <WorkflowCanvas initialNodes={initialNodes} initialEdges={initialEdges} />
        </div>
        <AnalyticsPanel workflowName={name} />
      </div>
    </motion.div>
  );
}
