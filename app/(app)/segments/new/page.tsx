"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Layers, Plus, Trash2, Save, RefreshCw, Users, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthSessionStore } from "@/lib/stores/auth-session";
import { useCreateSegment, useSegmentPreview } from "@/hooks/useSegments";
import type { SegmentCondition, SegmentRules } from "@/hooks/useSegments";
import { cn } from "@/lib/utils";

const FIELDS = [
  { value: "score", label: "Score" },
  { value: "lifecycleStage", label: "Lifecycle Stage" },
  { value: "status", label: "Status" },
  { value: "source", label: "Source" },
  { value: "email", label: "Email" },
  { value: "company", label: "Company" },
  { value: "tags", label: "Tags" },
];

const OPERATORS = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "≥" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "≤" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "not contains" },
  { value: "in", label: "is one of" },
];

const LIFECYCLE_STAGES = ["subscriber", "lead", "mql", "sql", "customer"];

function ConditionRow({ cond, index, onChange, onDelete }: {
  cond: SegmentCondition;
  index: number;
  onChange: (c: SegmentCondition) => void;
  onDelete: () => void;
}) {
  const isLifecycle = cond.field === "lifecycleStage";
  const isNumeric = cond.field === "score";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-[#64748B] w-8 text-right">{index === 0 ? "IF" : "AND"}</span>

      <select value={cond.field}
        onChange={(e) => onChange({ ...cond, field: e.target.value })}
        className="flex-1 min-w-[120px] h-9 px-2 text-sm rounded-lg border border-white/8 bg-[#0B0F1A] text-[#F1F5F9] focus:outline-none focus:border-[#38BDF8]/40">
        {FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>

      <select value={cond.operator}
        onChange={(e) => onChange({ ...cond, operator: e.target.value })}
        className="flex-1 min-w-[110px] h-9 px-2 text-sm rounded-lg border border-white/8 bg-[#0B0F1A] text-[#F1F5F9] focus:outline-none focus:border-[#38BDF8]/40">
        {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {isLifecycle ? (
        <select value={String(cond.value)}
          onChange={(e) => onChange({ ...cond, value: e.target.value })}
          className="flex-1 min-w-[110px] h-9 px-2 text-sm rounded-lg border border-white/8 bg-[#0B0F1A] text-[#F1F5F9] focus:outline-none focus:border-[#38BDF8]/40">
          {LIFECYCLE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ) : (
        <Input
          type={isNumeric ? "number" : "text"}
          value={String(cond.value)}
          onChange={(e) => onChange({ ...cond, value: isNumeric ? Number(e.target.value) : e.target.value })}
          placeholder={isNumeric ? "50" : "value"}
          className="flex-1 min-w-[100px] h-9 text-sm bg-[#0B0F1A] border-white/8 text-[#F1F5F9]"
        />
      )}

      <button onClick={onDelete} className="text-[#64748B] hover:text-[#F87171] transition-colors p-1.5">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function NewSegmentPage() {
  const router = useRouter();
  const session = useAuthSessionStore((s) => s.session);
  const workspaceId = session?.user?.memberships?.[0]?.workspaceId ?? "";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"dynamic" | "static">("dynamic");
  const [logic, setLogic] = useState<"AND" | "OR">("AND");
  const [conditions, setConditions] = useState<SegmentCondition[]>([
    { field: "score", operator: "gte", value: 50 },
  ]);
  const [saving, setSaving] = useState(false);

  const createSegment = useCreateSegment();
  const rules: SegmentRules = { logic, conditions };

  const { data: preview, isFetching: previewing } = useSegmentPreview(workspaceId, conditions.length > 0 ? rules : null);

  const addCondition = () => setConditions((prev) => [...prev, { field: "score", operator: "gte", value: 0 }]);
  const updateCondition = useCallback((i: number, c: SegmentCondition) =>
    setConditions((prev) => prev.map((old, idx) => idx === i ? c : old)), []);
  const deleteCondition = (i: number) => setConditions((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const seg = await createSegment.mutateAsync({ workspaceId, name, description, type, status: "active", rules });
      router.push(`/segments/${seg.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A14] text-[#F1F5F9] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#64748B] mb-1">Segments / New</div>
            <h1 className="text-2xl font-bold">Segment Builder</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.back()} className="text-[#64748B] hover:text-[#F1F5F9]">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}
              className="bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#0B0F1A] font-semibold hover:opacity-90">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
              Save Segment
            </Button>
          </div>
        </motion.div>

        {/* Basic */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white/8 bg-[#0D1117] p-5 space-y-4">
          <h2 className="text-sm font-semibold">Basic Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-[#64748B] mb-1 block">Segment Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hot Leads"
                className="h-10 bg-[#070A14] border-white/8 text-[#F1F5F9]" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[#64748B] mb-1 block">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description"
                className="h-10 bg-[#070A14] border-white/8 text-[#F1F5F9]" />
            </div>
            <div>
              <label className="text-xs text-[#64748B] mb-1 block">Type</label>
              <div className="flex gap-2">
                {(["dynamic", "static"] as const).map((t) => (
                  <button key={t} onClick={() => setType(t)}
                    className={cn("flex-1 h-10 text-sm rounded-xl border transition-all capitalize",
                      type === t ? "border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8]" : "border-white/8 text-[#64748B] hover:border-white/20")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {type === "dynamic" && (
              <div>
                <label className="text-xs text-[#64748B] mb-1 block">Logic</label>
                <div className="flex gap-2">
                  {(["AND", "OR"] as const).map((l) => (
                    <button key={l} onClick={() => setLogic(l)}
                      className={cn("flex-1 h-10 text-sm rounded-xl border transition-all",
                        logic === l ? "border-[#818CF8]/40 bg-[#818CF8]/10 text-[#818CF8]" : "border-white/8 text-[#64748B] hover:border-white/20")}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Rules */}
        {type === "dynamic" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/8 bg-[#0D1117] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Filter Rules</h2>
              <button onClick={addCondition} className="text-xs text-[#38BDF8] hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Rule
              </button>
            </div>

            {conditions.length === 0 ? (
              <div className="text-center py-6 text-[#64748B] text-sm">No rules — matches all leads</div>
            ) : (
              <div className="space-y-2">
                {conditions.map((c, i) => (
                  <ConditionRow key={i} cond={c} index={i}
                    onChange={(nc) => updateCondition(i, nc)}
                    onDelete={() => deleteCondition(i)} />
                ))}
              </div>
            )}

            {/* Live preview */}
            <div className={cn("rounded-xl border p-4 flex items-center gap-3 transition-all",
              previewing ? "border-white/8 bg-[#070A14]" : "border-[#38BDF8]/20 bg-[#38BDF8]/5")}>
              <Users className={cn("w-5 h-5", previewing ? "text-[#64748B] animate-pulse" : "text-[#38BDF8]")} />
              <div>
                <div className="text-sm font-semibold text-[#F1F5F9]">
                  {previewing ? "Computing..." : preview ? `${preview.matchCount.toLocaleString()} leads match` : "Add rules to preview"}
                </div>
                {preview && !previewing && (
                  <div className="text-xs text-[#64748B]">
                    out of {preview.total.toLocaleString()} total leads
                    {preview.sample.length > 0 && (
                      <> — e.g. {preview.sample.slice(0, 2).map((s) => s.email).join(", ")}</>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {type === "static" && (
          <div className="rounded-2xl border border-white/8 bg-[#0D1117] p-5 text-center text-[#64748B] text-sm">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Static segments are populated manually after creation using the member management UI.
          </div>
        )}
      </div>
    </div>
  );
}
