"use client";

import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import {
  Zap,
  Clock,
  Mail,
  GitBranch,
  ArrowLeftRight,
} from "lucide-react";

export type NodeStatus = "idle" | "running" | "completed";

export interface CustomNodeData extends Record<string, unknown> {
  label: string;
  status: NodeStatus;
  config?: Record<string, unknown>;
}

const nodeThemes: Record<
  string,
  {
    border: string;
    icon: React.ElementType;
    iconColor: string;
    label: string;
  }
> = {
  trigger: {
    border: "border-[#38BDF8]",
    icon: Zap,
    iconColor: "text-[#38BDF8]",
    label: "Trigger",
  },
  delay: {
    border: "border-[#A78BFA]",
    icon: Clock,
    iconColor: "text-[#A78BFA]",
    label: "Delay",
  },
  email: {
    border: "border-[#38BDF8]",
    icon: Mail,
    iconColor: "text-[#38BDF8]",
    label: "Email",
  },
  condition: {
    border: "border-[#FBBF24]",
    icon: GitBranch,
    iconColor: "text-[#FBBF24]",
    label: "Condition",
  },
  abSplit: {
    border: "border-[#34D399]",
    icon: ArrowLeftRight,
    iconColor: "text-[#34D399]",
    label: "A / B Split",
  },
};

function StatusDot({ status }: { status: NodeStatus }) {
  if (status === "idle") {
    return <div className="w-2 h-2 rounded-full bg-[#64748B]" />;
  }
  if (status === "running") {
    return <div className="w-2 h-2 rounded-full bg-[#FBBF24] animate-pulse" />;
  }
  return <div className="w-2 h-2 rounded-full bg-[#34D399]" />;
}

export function TriggerNode(props: NodeProps) {
  const data = props.data as CustomNodeData;
  const theme = nodeThemes.trigger;
  const Icon = theme.icon;
  return (
    <div
      className={cn(
        "group relative w-52 rounded-xl border bg-[#0B0F1A]/95 backdrop-blur px-4 py-3 shadow-sm transition-transform hover:scale-[1.02]",
        theme.border
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-[#0B0F1A] !border-2 !border-[#38BDF8]"
      />
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("w-4 h-4", theme.iconColor)} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
          {theme.label}
        </span>
        <div className="ml-auto">
          <StatusDot status={data.status || "idle"} />
        </div>
      </div>
      <div className="text-sm font-medium text-[#F1F5F9] truncate">
        {data.label || "Trigger"}
      </div>
      {data.config?.event ? (
        <div className="text-[11px] text-[#64748B] mt-0.5 font-mono truncate">
          {String(data.config.event)}
        </div>
      ) : null}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-[#0B0F1A] !border-2 !border-[#38BDF8]"
      />
    </div>
  );
}

export function DelayNode(props: NodeProps) {
  const data = props.data as CustomNodeData;
  const theme = nodeThemes.delay;
  const Icon = theme.icon;
  const delay = data.config?.duration ?? "--";
  const unit = data.config?.unit ?? "";
  return (
    <div
      className={cn(
        "group relative w-52 rounded-xl border bg-[#0B0F1A]/95 backdrop-blur px-4 py-3 shadow-sm transition-transform hover:scale-[1.02]",
        theme.border
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-[#0B0F1A] !border-2 !border-[#A78BFA]"
      />
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("w-4 h-4", theme.iconColor)} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
          {theme.label}
        </span>
        <div className="ml-auto">
          <StatusDot status={data.status || "idle"} />
        </div>
      </div>
      <div className="text-sm font-medium text-[#F1F5F9] truncate">
        {data.label || "Wait"}
      </div>
      <div className="text-[11px] text-[#64748B] mt-0.5 font-mono">
        {String(delay)} {String(unit)}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-[#0B0F1A] !border-2 !border-[#A78BFA]"
      />
    </div>
  );
}

export function EmailNode(props: NodeProps) {
  const data = props.data as CustomNodeData;
  const theme = nodeThemes.email;
  const Icon = theme.icon;
  const campaign = String(data.config?.campaign ?? "");
  return (
    <div
      className={cn(
        "group relative w-52 rounded-xl border bg-[#0B0F1A]/95 backdrop-blur px-4 py-3 shadow-sm transition-transform hover:scale-[1.02]",
        theme.border
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-[#0B0F1A] !border-2 !border-[#38BDF8]"
      />
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("w-4 h-4", theme.iconColor)} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
          {theme.label}
        </span>
        <div className="ml-auto">
          <StatusDot status={data.status || "idle"} />
        </div>
      </div>
      <div className="text-sm font-medium text-[#F1F5F9] truncate">
        {data.label || "Send Email"}
      </div>
      {campaign ? (
        <div className="text-[11px] text-[#64748B] mt-0.5 font-mono truncate">
          {campaign}
        </div>
      ) : null}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-[#0B0F1A] !border-2 !border-[#38BDF8]"
      />
    </div>
  );
}

export function ConditionNode(props: NodeProps) {
  const data = props.data as CustomNodeData;
  const theme = nodeThemes.condition;
  const Icon = theme.icon;
  const rule = String(data.config?.rule ?? "");
  return (
    <div
      className={cn(
        "group relative w-52 rounded-xl border bg-[#0B0F1A]/95 backdrop-blur px-4 py-3 shadow-sm transition-transform hover:scale-[1.02]",
        theme.border
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-[#0B0F1A] !border-2 !border-[#FBBF24]"
      />
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("w-4 h-4", theme.iconColor)} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
          {theme.label}
        </span>
        <div className="ml-auto">
          <StatusDot status={data.status || "idle"} />
        </div>
      </div>
      <div className="text-sm font-medium text-[#F1F5F9] truncate">
        {data.label || "If / Then"}
      </div>
      {rule ? (
        <div className="text-[11px] text-[#64748B] mt-0.5 font-mono truncate">
          {rule}
        </div>
      ) : null}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!w-2.5 !h-2.5 !bg-[#0B0F1A] !border-2 !border-[#34D399]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!w-2.5 !h-2.5 !bg-[#0B0F1A] !border-2 !border-[#F87171]"
        style={{ left: "70%" }}
      />
    </div>
  );
}

export function ABSplitNode(props: NodeProps) {
  const data = props.data as CustomNodeData;
  const theme = nodeThemes.abSplit;
  const Icon = theme.icon;
  const pct = Number(data.config?.splitA ?? 50);
  return (
    <div
      className={cn(
        "group relative w-52 rounded-xl border bg-[#0B0F1A]/95 backdrop-blur px-4 py-3 shadow-sm transition-transform hover:scale-[1.02]",
        theme.border
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-[#0B0F1A] !border-2 !border-[#34D399]"
      />
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("w-4 h-4", theme.iconColor)} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
          {theme.label}
        </span>
        <div className="ml-auto">
          <StatusDot status={data.status || "idle"} />
        </div>
      </div>
      <div className="text-sm font-medium text-[#F1F5F9] truncate">
        {data.label || `${pct}% / ${100 - pct}%`}
      </div>
      <div className="text-[11px] text-[#64748B] mt-0.5 font-mono">
        Branch A {pct}% · Branch B {100 - pct}%
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        className="!w-2.5 !h-2.5 !bg-[#0B0F1A] !border-2 !border-[#38BDF8]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        className="!w-2.5 !h-2.5 !bg-[#0B0F1A] !border-2 !border-[#818CF8]"
        style={{ left: "70%" }}
      />
    </div>
  );
}

export const nodeTypes = {
  trigger: TriggerNode,
  delay: DelayNode,
  email: EmailNode,
  condition: ConditionNode,
  abSplit: ABSplitNode,
};
