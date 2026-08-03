"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Star, Plus, Trash2, RefreshCw, Sparkles, TrendingUp, TrendingDown,
  BarChart3, Users, ToggleLeft, ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthSessionStore } from "@/lib/stores/auth-session";
import {
  useScoringRules, useCreateScoringRule, useUpdateScoringRule, useDeleteScoringRule,
  useRecalculateScores, useScoringLeaderboard, useAiScoringHints,
} from "@/hooks/useScoring";
import type { ScoringRule } from "@/hooks/useScoring";
import { cn } from "@/lib/utils";

const FIELDS = ["score", "lifecycleStage", "status", "source", "email", "company", "tags", "daysSinceCreated"];
const OPERATORS = ["eq", "neq", "gt", "gte", "lt", "lte", "contains", "not_contains", "in", "not_in"];
const LIFECYCLE_STAGES = ["subscriber", "lead", "mql", "sql", "customer"];

function scoreColor(score: number) {
  if (score >= 80) return "#34D399";
  if (score >= 60) return "#38BDF8";
  if (score >= 40) return "#FBBF24";
  return "#F87171";
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 rounded-full bg-white/8 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: scoreColor(score) }} />
      </div>
      <span className="text-sm font-bold" style={{ color: scoreColor(score) }}>{score}</span>
    </div>
  );
}

type NewRuleForm = {
  name: string;
  description: string;
  type: "positive" | "negative";
  conditionField: string;
  conditionOperator: string;
  conditionValue: string;
  points: number;
};

const defaultForm: NewRuleForm = {
  name: "",
  description: "",
  type: "positive",
  conditionField: "lifecycleStage",
  conditionOperator: "eq",
  conditionValue: "sql",
  points: 10,
};

export default function ScoringPage() {
  const session = useAuthSessionStore((s) => s.session);
  const workspaceId = session?.user?.memberships?.[0]?.workspaceId ?? "";

  const { data, isLoading, refetch } = useScoringRules(workspaceId);
  const { data: leaderboard } = useScoringLeaderboard(workspaceId);
  const { data: aiData } = useAiScoringHints(workspaceId);
  const createRule = useCreateScoringRule();
  const updateRule = useUpdateScoringRule();
  const deleteRule = useDeleteScoringRule();
  const recalculate = useRecalculateScores();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewRuleForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [recalcResult, setRecalcResult] = useState<{ updated: number; total: number } | null>(null);

  const rules = data?.rules ?? [];
  const stats = data?.stats;
  const topLeads = leaderboard?.top ?? [];
  const bottomLeads = leaderboard?.bottom ?? [];
  const hints = aiData?.hints ?? [];

  const handleSaveRule = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await createRule.mutateAsync({
        workspaceId,
        name: form.name,
        description: form.description,
        type: form.type,
        condition: {
          field: form.conditionField,
          operator: form.conditionOperator,
          value: isNaN(Number(form.conditionValue)) ? form.conditionValue : Number(form.conditionValue),
        },
        points: form.points,
        isActive: true,
      });
      setForm(defaultForm);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRule = (rule: ScoringRule) => {
    updateRule.mutate({ id: rule.id, workspaceId, isActive: !rule.isActive });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this rule?")) return;
    deleteRule.mutate(id);
  };

  const handleRecalculate = async () => {
    const result = await recalculate.mutateAsync({ workspaceId });
    setRecalcResult(result);
    refetch();
  };

  const applyHint = (hint: typeof hints[0]) => {
    setForm({
      name: hint.name,
      description: hint.description,
      type: hint.type,
      conditionField: hint.condition.field,
      conditionOperator: hint.condition.operator,
      conditionValue: String(hint.condition.value),
      points: hint.points,
    });
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-[#070A14] text-[#F1F5F9] p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#64748B] mb-1">
            <Star className="w-3.5 h-3.5" /> Lead Scoring
          </div>
          <h1 className="text-2xl font-bold">Scoring Rules</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Define positive and negative rules to rank your leads automatically</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleRecalculate} disabled={recalculate.isPending}
            className="bg-[#1E2538] text-[#F1F5F9] border border-white/8 hover:bg-[#2B354F] h-9 px-3 text-sm">
            {recalculate.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
            Recalculate All
          </Button>
          <Button onClick={() => setShowForm((v) => !v)}
            className="bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#0B0F1A] font-semibold hover:opacity-90">
            <Plus className="w-4 h-4 mr-1.5" /> Add Rule
          </Button>
        </div>
      </motion.div>

      {/* Recalc result */}
      {recalcResult && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
          ✓ Recalculated {recalcResult.total} leads — {recalcResult.updated} scores updated
        </motion.div>
      )}

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {stats && [
          { label: "Total Leads", value: stats.totalLeads, color: "text-[#F1F5F9]" },
          { label: "Avg Score", value: stats.avgScore, color: "text-[#38BDF8]" },
          { label: "Max Score", value: stats.maxScore, color: "text-emerald-400" },
          { label: "Min Score", value: stats.minScore, color: "text-[#F87171]" },
          { label: "Score ≥ 80", value: stats.highScoreLeads, color: "text-yellow-400" },
          { label: "Score ≤ 20", value: stats.lowScoreLeads, color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/8 bg-[#0D1117] p-4">
            <div className="text-xs text-[#64748B] mb-1">{s.label}</div>
            <div className={cn("text-xl font-bold", s.color)}>{s.value}</div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add Rule Form */}
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[#38BDF8]/20 bg-[#38BDF8]/5 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-[#38BDF8]">New Scoring Rule</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-[#64748B] mb-1 block">Rule Name *</label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. SQL stage bonus" className="h-9 bg-[#070A14] border-white/8 text-[#F1F5F9] text-sm" />
                </div>
                <div>
                  <label className="text-xs text-[#64748B] mb-1 block">Type</label>
                  <div className="flex gap-2">
                    {(["positive", "negative"] as const).map((t) => (
                      <button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))}
                        className={cn("flex-1 h-9 text-xs rounded-lg border capitalize transition-all",
                          form.type === t
                            ? t === "positive" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-red-500/40 bg-red-500/10 text-[#F87171]"
                            : "border-white/8 text-[#64748B]")}>
                        {t === "positive" ? "+" : "−"} {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#64748B] mb-1 block">Points</label>
                  <Input type="number" min={1} max={100} value={form.points}
                    onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))}
                    className="h-9 bg-[#070A14] border-white/8 text-[#F1F5F9] text-sm" />
                </div>
                <div>
                  <label className="text-xs text-[#64748B] mb-1 block">Field</label>
                  <select value={form.conditionField} onChange={(e) => setForm((f) => ({ ...f, conditionField: e.target.value }))}
                    className="w-full h-9 px-2 text-sm rounded-lg border border-white/8 bg-[#070A14] text-[#F1F5F9] focus:outline-none focus:border-[#38BDF8]/40">
                    {FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#64748B] mb-1 block">Operator</label>
                  <select value={form.conditionOperator} onChange={(e) => setForm((f) => ({ ...f, conditionOperator: e.target.value }))}
                    className="w-full h-9 px-2 text-sm rounded-lg border border-white/8 bg-[#070A14] text-[#F1F5F9] focus:outline-none focus:border-[#38BDF8]/40">
                    {OPERATORS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-[#64748B] mb-1 block">Value</label>
                  {form.conditionField === "lifecycleStage" ? (
                    <select value={form.conditionValue} onChange={(e) => setForm((f) => ({ ...f, conditionValue: e.target.value }))}
                      className="w-full h-9 px-2 text-sm rounded-lg border border-white/8 bg-[#070A14] text-[#F1F5F9] focus:outline-none focus:border-[#38BDF8]/40">
                      {LIFECYCLE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <Input value={form.conditionValue} onChange={(e) => setForm((f) => ({ ...f, conditionValue: e.target.value }))}
                      placeholder="Condition value" className="h-9 bg-[#070A14] border-white/8 text-[#F1F5F9] text-sm" />
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveRule} disabled={saving || !form.name.trim()}
                  className="bg-[#38BDF8] text-[#0B0F1A] font-semibold hover:bg-[#38BDF8]/90 h-9 px-4 text-sm">
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : null} Save Rule
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)} className="text-[#64748B] h-9 text-sm">Cancel</Button>
              </div>
            </motion.div>
          )}

          {/* Rules list */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/8 bg-[#0D1117] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <span className="text-sm font-medium">Scoring Rules ({rules.length})</span>
              <button onClick={() => refetch()} className="text-[#64748B] hover:text-[#38BDF8] transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-[#64748B]">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading rules...
              </div>
            ) : rules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-[#64748B]">
                <Star className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm font-medium text-[#F1F5F9]">No scoring rules</p>
                <p className="text-xs mt-1">Add rules or use AI hints to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-white/6">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors group">
                    <div className={cn("shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                      rule.type === "positive" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-[#F87171]")}>
                      {rule.type === "positive" ? "+" : "−"}{rule.points}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-sm font-medium", rule.isActive ? "text-[#F1F5F9]" : "text-[#64748B] line-through")}>
                        {rule.name}
                      </div>
                      <div className="text-xs text-[#64748B]">
                        {rule.condition.field} {rule.condition.operator} {String(rule.condition.value)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleToggleRule(rule)} title={rule.isActive ? "Disable" : "Enable"}
                        className={cn("transition-colors", rule.isActive ? "text-emerald-400 hover:text-[#64748B]" : "text-[#64748B] hover:text-emerald-400")}>
                        {rule.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button onClick={() => handleDelete(rule.id)} className="text-[#64748B] hover:text-[#F87171] transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* AI Hints */}
          {hints.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="rounded-2xl border border-[#818CF8]/20 bg-[#818CF8]/5 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#818CF8]" />
                <h2 className="text-sm font-semibold text-[#818CF8]">AI Suggestions</h2>
              </div>
              <div className="space-y-2">
                {hints.map((h, i) => (
                  <button key={i} onClick={() => applyHint(h)}
                    className="w-full text-left rounded-xl border border-white/8 bg-[#0D1117] p-3 hover:border-[#818CF8]/30 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-xs font-bold", h.type === "positive" ? "text-emerald-400" : "text-[#F87171]")}>
                        {h.type === "positive" ? "+" : "−"}{h.points}
                      </span>
                      <span className="text-xs font-medium text-[#F1F5F9] truncate">{h.name}</span>
                    </div>
                    <p className="text-xs text-[#64748B]">{h.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Top leads */}
          {topLeads.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
              className="rounded-2xl border border-white/8 bg-[#0D1117] p-5 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold">Top Leads</h2>
              </div>
              <div className="space-y-2">
                {topLeads.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[#F1F5F9] truncate">{lead.firstName} {lead.lastName}</div>
                      <div className="text-xs text-[#64748B] truncate">{lead.email}</div>
                    </div>
                    <ScoreBar score={lead.score} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Bottom leads */}
          {bottomLeads.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
              className="rounded-2xl border border-white/8 bg-[#0D1117] p-5 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-[#F87171]" />
                <h2 className="text-sm font-semibold">Needs Attention</h2>
              </div>
              <div className="space-y-2">
                {bottomLeads.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[#F1F5F9] truncate">{lead.firstName} {lead.lastName}</div>
                      <div className="text-xs text-[#64748B] truncate">{lead.email}</div>
                    </div>
                    <ScoreBar score={lead.score} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
