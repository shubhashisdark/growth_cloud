"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Upload,
  Download,
  Archive,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckSquare,
} from "lucide-react";
import { useLeads, type LeadListParams } from "@/hooks/useLeads";
import type { Lead, LeadStage, LeadStatus } from "@/lib/backend";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(lead: Lead) {
  const name = `${lead.firstName} ${lead.lastName}`.trim() || lead.email;
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function displayName(lead: Lead) {
  const full = `${lead.firstName} ${lead.lastName}`.trim();
  return full || lead.email;
}

function gradientFromName(name: string) {
  const gradients = [
    "linear-gradient(135deg, #F87171, #FB923C)",
    "linear-gradient(135deg, #818CF8, #A78BFA)",
    "linear-gradient(135deg, #34D399, #22D3EE)",
    "linear-gradient(135deg, #F472B6, #FB7185)",
    "linear-gradient(135deg, #A78BFA, #C084FC)",
    "linear-gradient(135deg, #60A5FA, #34D399)",
    "linear-gradient(135deg, #FB923C, #FACC15)",
    "linear-gradient(135deg, #22D3EE, #818CF8)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

const stageBadgeClasses: Record<LeadStage, string> = {
  subscriber: "bg-sky-500/10 text-sky-300 border border-sky-500/20",
  lead: "bg-violet-500/10 text-violet-300 border border-violet-500/20",
  mql: "bg-purple-500/10 text-purple-300 border border-purple-500/20",
  sql: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
  customer: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
};

function scoreColor(score: number) {
  if (score >= 80) return "#34D399";
  if (score >= 50) return "#A78BFA";
  return "#38BDF8";
}

function formatTimeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  delay,
}: {
  label: string;
  value: string | number;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      className="bg-[#111827] border border-white/[0.08] rounded-xl p-5 flex-1"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="text-[28px] font-bold tracking-tight mb-1" style={{ color }}>
        {value}
      </div>
      <div className="text-xs text-[#64748B] uppercase tracking-widest font-semibold">{label}</div>
    </motion.div>
  );
}

// ─── Add Lead Dialog ────────────────────────────────────────────────────────

function AddLeadDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    email: "",
    firstName: "",
    lastName: "",
    company: "",
    source: "Direct",
    lifecycleStage: "lead" as LeadStage,
    consentEmail: false,
    consentSms: false,
  });

  const { createLeadMutation } = useLeads();
  const error = createLeadMutation.error?.message ?? "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createLeadMutation.mutateAsync(form);
    setOpen(false);
    setForm({ email: "", firstName: "", lastName: "", company: "", source: "Direct", lifecycleStage: "lead", consentEmail: false, consentSms: false });
    onCreated?.();
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-9 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm rounded-lg"
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Add Lead
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#111827] border-white/[0.08] text-[#F1F5F9] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add New Lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#64748B] mb-1">First Name *</label>
                <Input name="firstName" value={form.firstName} onChange={handleChange} required placeholder="Jane" className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] h-9 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-[#64748B] mb-1">Last Name</label>
                <Input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Doe" className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] h-9 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#64748B] mb-1">Email *</label>
              <Input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="jane@acme.com" className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] h-9 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#64748B] mb-1">Company</label>
                <Input name="company" value={form.company} onChange={handleChange} placeholder="Acme Inc." className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] h-9 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-[#64748B] mb-1">Source</label>
                <Input name="source" value={form.source} onChange={handleChange} placeholder="Organic" className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] h-9 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#64748B] mb-1">Lifecycle Stage</label>
              <select name="lifecycleStage" value={form.lifecycleStage} onChange={handleChange} className="w-full h-9 rounded-lg bg-[#0B0F1A] border border-white/[0.08] text-[#F1F5F9] text-sm px-3">
                <option value="subscriber">Subscriber</option>
                <option value="lead">Lead</option>
                <option value="mql">MQL</option>
                <option value="sql">SQL</option>
                <option value="customer">Customer</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="consentEmail" checked={form.consentEmail} onChange={handleChange} className="rounded" />
                <span className="text-[#94A3B8]">Email consent</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="consentSms" checked={form.consentSms} onChange={handleChange} className="rounded" />
                <span className="text-[#94A3B8]">SMS consent</span>
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-[#64748B] hover:text-[#F1F5F9]">Cancel</Button>
              <Button type="submit" disabled={createLeadMutation.isPending} className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold">
                {createLeadMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Creating…</> : "Create Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── CSV Import Dialog ───────────────────────────────────────────────────────

function ImportCsvButton() {
  const [open, setOpen] = React.useState(false);
  const [result, setResult] = React.useState<{ imported: number; errors: string[] } | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const { importCsvMutation } = useLeads();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = await importCsvMutation.mutateAsync(text);
    setResult(res.data);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-9 px-4 border-white/[0.12] text-[#94A3B8] bg-transparent hover:bg-white/5 hover:text-[#F1F5F9] text-sm rounded-lg"
      >
        <Upload className="w-3.5 h-3.5 mr-1.5" />
        Import CSV
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setResult(null); }}>
        <DialogContent className="bg-[#111827] border-white/[0.08] text-[#F1F5F9] max-w-md">
          <DialogHeader>
            <DialogTitle>Import Leads via CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-[#94A3B8]">
              CSV columns: <code className="text-sky-300 text-xs">email, firstName, lastName, company, source, lifecycleStage</code>
            </p>

            {result ? (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm">
                <p className="text-emerald-300 font-semibold">✓ {result.imported} leads imported</p>
                {result.errors.length > 0 && (
                  <ul className="mt-2 space-y-1 text-amber-300 text-xs">
                    {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                    {result.errors.length > 5 && <li>…and {result.errors.length - 5} more</li>}
                  </ul>
                )}
              </div>
            ) : (
              <label className="block cursor-pointer rounded-xl border-2 border-dashed border-white/[0.12] p-8 text-center hover:border-sky-500/40 hover:bg-sky-500/5 transition-colors">
                {importCsvMutation.isPending ? (
                  <div className="flex flex-col items-center gap-2 text-[#64748B]">
                    <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                    <span className="text-sm">Importing…</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[#64748B]">
                    <Upload className="w-6 h-6 text-sky-400" />
                    <span className="text-sm">Click or drop CSV file here</span>
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} disabled={importCsvMutation.isPending} />
              </label>
            )}

            {importCsvMutation.error && (
              <p className="text-sm text-rose-400">{importCsvMutation.error.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setOpen(false); setResult(null); }} className="text-[#64748B]">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [params, setParams] = React.useState<LeadListParams>({
    status: "active",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    limit: 25,
  });

  const [stageFilter, setStageFilter] = React.useState<"all" | LeadStage>("all");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkStage, setBulkStage] = React.useState<LeadStage>("mql");

  const statusFilter = params.status ?? "active";
  const viewingArchived = statusFilter === "archived";

  const hook = useLeads(params);
  const { items, meta, isLoading, error, bulkActionMutation, deleteLeadMutation, exportCsv } = hook;

  function updateParam<K extends keyof LeadListParams>(key: K, value: LeadListParams[K]) {
    setParams((prev) => ({ ...prev, [key]: value, page: key !== "page" ? 1 : (value as number) }));
  }

  function setStatus(status: LeadStatus) {
    setSelectedIds(new Set());
    updateParam("status", status);
  }

  function setStage(stage: "all" | LeadStage) {
    setStageFilter(stage);
    updateParam("stage", stage === "all" ? undefined : stage);
  }

  // Stats
  const total = meta?.total ?? 0;
  const mqls = items.filter((l) => l.lifecycleStage === "mql").length;
  const sqls = items.filter((l) => l.lifecycleStage === "sql").length;
  const customers = items.filter((l) => l.lifecycleStage === "customer").length;

  // Select helpers
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selectedIds.size === items.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map((l) => l.id)));
  }

  async function handleBulkAction(action: "archive" | "activate" | "advance_stage") {
    if (selectedIds.size === 0) return;
    await bulkActionMutation.mutateAsync({
      leadIds: Array.from(selectedIds),
      action,
      stage: action === "advance_stage" ? bulkStage : undefined,
    });
    setSelectedIds(new Set());
  }

  const uniqueSources = Array.from(new Set(items.map((l) => l.source)));

  return (
    <main className="min-h-screen text-[#F1F5F9] p-6 md:p-10">
      <div className="max-w-[1280px] mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-7">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight">Leads</h1>
            <p className="text-sm text-[#64748B] mt-1">
              Manage, score, and segment your leads in one place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={exportCsv}
              className="h-9 px-4 border-white/[0.12] text-[#94A3B8] bg-transparent hover:bg-white/5 hover:text-[#F1F5F9] text-sm rounded-lg"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
            <ImportCsvButton />
            <AddLeadDialog />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error instanceof Error ? error.message : "Failed to load leads"}
          </div>
        )}

        {/* Active / Archived status switch */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Lead status"
            className="inline-flex rounded-xl border border-white/[0.08] bg-[#0B0F1A] p-1"
          >
            <button
              role="tab"
              aria-selected={!viewingArchived}
              onClick={() => setStatus("active")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                !viewingArchived
                  ? "bg-[#1A1F2E] text-[#F1F5F9] shadow-sm"
                  : "text-[#64748B] hover:text-[#F1F5F9]",
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Active
            </button>
            <button
              role="tab"
              aria-selected={viewingArchived}
              onClick={() => setStatus("archived")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                viewingArchived
                  ? "bg-[#1A1F2E] text-[#F1F5F9] shadow-sm"
                  : "text-[#64748B] hover:text-[#F1F5F9]",
              )}
            >
              <Archive className="h-3.5 w-3.5" />
              Archived
            </button>
          </div>

          <p className="text-xs text-[#64748B]">
            {viewingArchived
              ? "Archived leads are hidden from campaigns until restored."
              : "Showing live leads available for scoring, campaigns, and workflows."}
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-6">
          <StatCard
            label={viewingArchived ? "Archived Leads" : "Active Leads"}
            value={total.toLocaleString()}
            color="#F1F5F9"
            delay={0}
          />
          <StatCard label="MQLs" value={mqls.toLocaleString()} color="#A78BFA" delay={0.07} />
          <StatCard label="SQLs" value={sqls.toLocaleString()} color="#34D399" delay={0.14} />
          <StatCard label="Customers" value={customers.toLocaleString()} color="#FBBF24" delay={0.21} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1 max-w-[360px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <Input
              value={params.q ?? ""}
              onChange={(e) => updateParam("q", e.target.value || undefined)}
              placeholder="Search by name, email, or company…"
              className="h-10 pl-9 bg-[#111827] border-white/[0.08] text-[#F1F5F9] placeholder:text-[#64748B] rounded-lg text-sm"
            />
          </div>

          {/* Stage filters */}
          {(["all", "subscriber", "lead", "mql", "sql", "customer"] as const).map((stage) => (
            <button
              key={stage}
              onClick={() => setStage(stage)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors border capitalize",
                stageFilter === stage
                  ? "bg-[#1A1F2E] border-white/[0.14] text-[#F1F5F9]"
                  : "bg-[#111827] border-white/[0.08] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1A1F2E]",
              )}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: stage === "all" ? "#38BDF8" : stage === "subscriber" ? "#38BDF8" : stage === "lead" ? "#818CF8" : stage === "mql" ? "#A78BFA" : stage === "sql" ? "#34D399" : "#FBBF24" }}
              />
              {stage === "all" ? "All stages" : stage.toUpperCase()}
            </button>
          ))}

          {/* More filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 px-4 text-[13px] font-medium rounded-lg border-white/[0.14] text-[#94A3B8] bg-transparent hover:bg-white/5 hover:text-[#F1F5F9]">
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 bg-[#1A1F2E] border-white/[0.08] p-4 space-y-4">
              <div>
                <label className="text-xs text-[#64748B] font-semibold uppercase tracking-wider mb-1.5 block">Status</label>
                <Select value={statusFilter} onValueChange={(v) => setStatus(v as LeadStatus)}>
                  <SelectTrigger className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] h-9 rounded-lg text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1F2E] border-white/[0.08]">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-[#64748B] font-semibold uppercase tracking-wider mb-1.5 block">Source</label>
                <Select value={params.source ?? "all"} onValueChange={(v) => updateParam("source", v === "all" ? undefined : v)}>
                  <SelectTrigger className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] h-9 rounded-lg text-sm">
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1F2E] border-white/[0.08]">
                    <SelectItem value="all">All sources</SelectItem>
                    {uniqueSources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-[#64748B] font-semibold uppercase tracking-wider mb-1.5 block">Sort by</label>
                <Select value={params.sortBy ?? "createdAt"} onValueChange={(v) => updateParam("sortBy", v)}>
                  <SelectTrigger className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] h-9 rounded-lg text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1F2E] border-white/[0.08]">
                    <SelectItem value="createdAt">Created at</SelectItem>
                    <SelectItem value="updatedAt">Last updated</SelectItem>
                    <SelectItem value="score">Score</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-3 rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3"
          >
            <CheckSquare className="w-4 h-4 text-sky-400" />
            <span className="text-sm text-sky-300 font-semibold">{selectedIds.size} selected</span>
            <div className="flex-1" />

            {!viewingArchived && (
              <>
                <Select value={bulkStage} onValueChange={(v) => setBulkStage(v as LeadStage)}>
                  <SelectTrigger className="h-8 bg-[#0B0F1A] border-sky-500/20 text-[#F1F5F9] text-xs rounded-lg w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1F2E] border-white/[0.08]">
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="mql">MQL</SelectItem>
                    <SelectItem value="sql">SQL</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => handleBulkAction("advance_stage")} disabled={bulkActionMutation.isPending} className="h-8 px-3 text-xs bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-lg">
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Advance Stage
                </Button>
                <Button onClick={() => handleBulkAction("archive")} disabled={bulkActionMutation.isPending} variant="outline" className="h-8 px-3 text-xs border-white/[0.12] text-[#94A3B8] bg-transparent hover:bg-amber-500/10 hover:text-amber-300 rounded-lg">
                  <Archive className="w-3 h-3 mr-1" />
                  Archive
                </Button>
              </>
            )}

            {viewingArchived && (
              <Button onClick={() => handleBulkAction("activate")} disabled={bulkActionMutation.isPending} className="h-8 px-3 text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg">
                <RotateCcw className="w-3 h-3 mr-1" />
                Restore to Active
              </Button>
            )}

            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-[#64748B] hover:text-[#F1F5F9] transition-colors">Clear</button>
          </motion.div>
        )}

        {/* Table */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
            <span className="text-[13px] text-[#64748B]">
              {isLoading
                ? "Loading…"
                : `${total.toLocaleString()} ${viewingArchived ? "archived" : "active"} lead${total === 1 ? "" : "s"}`}
            </span>
            {viewingArchived && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-amber-300/90">
                <Archive className="w-3 h-3" />
                Archive view
              </span>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/[0.08] hover:bg-transparent bg-[#1A1F2E]">
                <TableHead className="px-5 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === items.length && items.length > 0}
                    onChange={selectAll}
                    className="rounded accent-sky-500"
                  />
                </TableHead>
                <TableHead className="px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-widest font-semibold">Lead</TableHead>
                <TableHead className="px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-widest font-semibold">Status</TableHead>
                <TableHead className="px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-widest font-semibold">Stage</TableHead>
                <TableHead className="px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-widest font-semibold">Score</TableHead>
                <TableHead className="px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-widest font-semibold">Tags</TableHead>
                <TableHead className="px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-widest font-semibold">Source</TableHead>
                <TableHead className="px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-widest font-semibold">Updated</TableHead>
                <TableHead className="px-5 py-3 w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={i} className="border-b border-white/[0.08]">
                      {Array.from({ length: 9 }, (__, j) => (
                        <TableCell key={j} className="px-5 py-4">
                          <div className="h-4 bg-white/[0.04] rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : items.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className={cn(
                        "group border-b border-white/[0.08] hover:bg-white/[0.025] transition-colors",
                        selectedIds.has(lead.id) && "bg-sky-500/5",
                        viewingArchived && "opacity-90",
                      )}
                    >
                      <TableCell className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(lead.id)}
                          onChange={() => toggleSelect(lead.id)}
                          className="rounded accent-sky-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <Link href={`/leads/${lead.id}`} className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                            style={{ background: gradientFromName(displayName(lead)) }}
                          >
                            {getInitials(lead)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#F1F5F9] group-hover:text-sky-300 transition-colors">
                              {displayName(lead)}
                            </div>
                            <div className="text-xs text-[#64748B] font-mono">{lead.email}</div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <Badge
                          className={cn(
                            "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border",
                            lead.status === "archived"
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
                          )}
                        >
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <Badge className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md", stageBadgeClasses[lead.lifecycleStage])}>
                          {lead.lifecycleStage}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium font-mono" style={{ color: scoreColor(lead.score) }}>
                            {lead.score}
                          </span>
                          <div className="w-[40px] h-1 bg-white/[0.06] rounded overflow-hidden">
                            <div className="h-full rounded" style={{ width: `${Math.min(100, lead.score)}%`, background: scoreColor(lead.score) }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {(lead.tags ?? []).slice(0, 2).map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-[#070A14] border border-white/[0.08] rounded text-[11px] text-[#94A3B8]">{tag}</span>
                          ))}
                          {(lead.tags ?? []).length > 2 && <span className="text-[11px] text-[#64748B]">+{lead.tags.length - 2}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3.5 text-sm text-[#94A3B8]">{lead.source}</TableCell>
                      <TableCell className="px-5 py-3.5 text-xs text-[#64748B] font-mono">{formatTimeAgo(lead.updatedAt)}</TableCell>
                      <TableCell className="px-5 py-3.5">
                        {viewingArchived ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void bulkActionMutation.mutateAsync({ leadIds: [lead.id], action: "activate" });
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#64748B] hover:text-emerald-300 hover:bg-emerald-500/10 transition-all"
                            title="Restore to active"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLeadMutation.mutate(lead.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#64748B] hover:text-amber-300 hover:bg-amber-500/10 transition-all"
                            title="Archive lead"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="px-5 py-12 text-center text-sm text-[#64748B]">
                    {viewingArchived ? (
                      <>
                        No archived leads yet.{" "}
                        <button onClick={() => setStatus("active")} className="text-sky-400 hover:underline">
                          Back to active leads
                        </button>
                      </>
                    ) : (
                      <>
                        No active leads match your filters.{" "}
                        <button
                          onClick={() =>
                            setParams({ status: "active", sortBy: "createdAt", sortOrder: "desc", page: 1, limit: 25 })
                          }
                          className="text-sky-400 hover:underline"
                        >
                          Clear filters
                        </button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.08]">
            <span className="text-[13px] text-[#64748B]">
              {meta ? `Page ${meta.page} of ${Math.max(1, Math.ceil(meta.total / meta.limit))}` : ""}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={!meta || meta.page <= 1}
                onClick={() => updateParam("page", (params.page ?? 1) - 1)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F1F5F9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1.5 text-sm text-[#F1F5F9] font-medium">{meta?.page ?? 1}</span>
              <button
                disabled={!meta?.hasNext}
                onClick={() => updateParam("page", (params.page ?? 1) + 1)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F1F5F9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
