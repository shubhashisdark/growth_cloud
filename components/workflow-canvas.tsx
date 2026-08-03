"use client";

import React, { useCallback, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  useReactFlow,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nodeTypes, type CustomNodeData } from "@/components/workflow-node";
import { cn } from "@/lib/utils";
import { Trash2, Play, Pause } from "lucide-react";

function FlowInner({
  initialNodes,
  initialEdges,
  onFlowInstance,
}: {
  initialNodes: Node<CustomNodeData>[];
  initialEdges: Edge[];
  onFlowInstance: (instance: ReactFlowInstance) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const flow = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    onFlowInstance(flow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "default",
            animated: true,
            style: { stroke: "#38BDF8", strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (typeof type === "undefined" || !type) return;

      const position = flow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node<CustomNodeData> = {
        id: `${type}_${Math.random().toString(36).slice(2, 7)}`,
        type,
        position,
        data: {
          label: getDefaultLabel(type),
          status: "idle" as const,
          config: getDefaultConfig(type),
        },
      };
      setNodes((nds: Node<CustomNodeData>[]) => [...nds, newNode]);
    },
    [flow, setNodes]
  );

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      const ids = new Set(deleted.map((n) => n.id));
      setEdges((eds) =>
        eds.filter((e) => !ids.has(e.source) && !ids.has(e.target))
      );
    },
    [setEdges]
  );

  const runSimulationRef = React.useRef<() => void>(() => {});

  runSimulationRef.current = () => {
    const order = [...nodes];
    order.forEach((n, i) => {
      setTimeout(() => {
        setNodes((prev: Node<CustomNodeData>[]) =>
          prev.map((node) =>
            node.id === n.id ? { ...node, data: { ...node.data, status: "running" as const } } : node
          )
        );
        setTimeout(() => {
          setNodes((prev: Node<CustomNodeData>[]) =>
            prev.map((node) =>
              node.id === n.id ? { ...node, data: { ...node.data, status: "completed" as const } } : node
            )
          );
        }, 800);
      }, i * 600);
    });
  };

  return (
    <div ref={reactFlowWrapper} className="flex-1 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        deleteKeyCode="Delete"
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        className="bg-[#070A14]"
      >
        <Background
          gap={20}
          size={1}
          color="rgba(255,255,255,0.04)"
        />
        <Controls
          className="!bg-[#111827] !border-white/[0.08] [&>button]:!bg-[#111827] [&>button]:!border-white/[0.08] [&>button]:!text-[#94A3B8] [&>button:hover]:!text-[#F1F5F9]"
        />
      </ReactFlow>
      <div className="absolute top-3 left-3 flex gap-2 z-10">
        <button
          onClick={() => runSimulationRef.current()}
          className="h-8 px-3 rounded-lg text-xs font-semibold bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/20 hover:bg-[#34D399]/20 flex items-center gap-1.5 transition-colors"
        >
          <Play className="w-3.5 h-3.5" />
          Run
        </button>
        <button
          onClick={() => {
            setNodes((prev: Node<CustomNodeData>[]) =>
              prev.map((n) => ({ ...n, data: { ...n.data, status: "idle" as const } }))
            );
          }}
          className="h-8 px-3 rounded-lg text-xs font-semibold bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20 hover:bg-[#FBBF24]/20 flex items-center gap-1.5 transition-colors"
        >
          <Pause className="w-3.5 h-3.5" />
          Reset
        </button>
        <button
          onClick={() => {
            setNodes([]);
            setEdges([]);
          }}
          className="h-8 px-3 rounded-lg text-xs font-semibold bg-[#F87171]/10 text-[#F87171] border border-[#F87171]/20 hover:bg-[#F87171]/20 flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>
    </div>
  );
}

function getDefaultLabel(type: string): string {
  switch (type) {
    case "trigger":
      return "Page View";
    case "delay":
      return "Wait 1 day";
    case "email":
      return "Send Email";
    case "condition":
      return "Score >= 50";
    case "abSplit":
      return "50 / 50 Split";
    default:
      return "Node";
  }
}

function getDefaultConfig(type: string): Record<string, unknown> {
  switch (type) {
    case "trigger":
      return { event: "page_view" };
    case "delay":
      return { duration: 1, unit: "day" };
    case "email":
      return { campaign: "Welcome Sequence" };
    case "condition":
      return { rule: "score >= 50" };
    case "abSplit":
      return { splitA: 50 };
    default:
      return {};
  }
}

const paletteItems = [
  { type: "trigger", label: "Trigger", color: "#38BDF8", desc: "Page view, form, tag" },
  { type: "delay", label: "Delay", color: "#A78BFA", desc: "Wait N days/hours" },
  { type: "email", label: "Email", color: "#38BDF8", desc: "Select campaign" },
  { type: "condition", label: "Condition", color: "#FBBF24", desc: "Score or stage rule" },
  { type: "abSplit", label: "A / B Split", color: "#34D399", desc: "Percentage branches" },
];

export function WorkflowCanvas({
  initialNodes = [],
  initialEdges = [],
}: {
  initialNodes?: Node<CustomNodeData>[];
  initialEdges?: Edge[];
}) {
  const [flowInstance, setFlowInstance] = React.useState<ReactFlowInstance | null>(null);

  return (
    <div className="flex h-full w-full rounded-xl border border-white/[0.08] overflow-hidden bg-[#070A14]">
      <div className="w-[200px] flex flex-col border-r border-white/[0.08] bg-[#0B0F1A] p-3 gap-2 shrink-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] px-1 mb-1">
          Node Palette
        </div>
        {paletteItems.map((item) => (
          <div
            key={item.type}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#111827] border border-white/[0.08] cursor-grab active:cursor-grabbing hover:bg-[#1A1F2E] transition-colors"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/reactflow", item.type);
              e.dataTransfer.effectAllowed = "move";
            }}
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: item.color }}
            />
            <div>
              <div className="text-xs font-medium text-[#F1F5F9]">{item.label}</div>
              <div className="text-[10px] text-[#64748B]">{item.desc}</div>
            </div>
          </div>
        ))}
        <div className="mt-auto text-[10px] text-[#64748B] px-1 leading-relaxed">
          Drag nodes onto the canvas. Use delete key to remove selected items.
        </div>
      </div>
      <ReactFlowProvider>
        <FlowInner
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          onFlowInstance={setFlowInstance}
        />
      </ReactFlowProvider>
    </div>
  );
}
