"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLeadDetail } from "@/hooks/useLeads";
import type { LeadStage } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Mail,
  Building,
  Globe,
  Tag,
  UserCheck,
  Calendar,
  Send,
  MessageSquare,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  Save,
  Trash2,
} from "lucide-react";

const stageBadgeClasses: Record<LeadStage, string> = {
  subscriber: "bg-sky-500/10 text-sky-300 border border-sky-500/20",
  lead: "bg-violet-500/10 text-violet-300 border border-violet-500/20",
  mql: "bg-purple-500/10 text-purple-300 border border-purple-500/20",
  sql: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
  customer: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = typeof params?.leadId === "string" ? params.leadId : null;

  const {
    lead,
    isLoading,
    error,
    addNoteMutation,
    updateConsentMutation,
    updateLeadMutation,
  } = useLeadDetail(leadId);

  const [activeTab, setActiveTab] = React.useState<"timeline" | "notes" | "custom_fields">("timeline");
  const [noteText, setNoteText] = React.useState("");
  const [editing, setEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    source: "",
    lifecycleStage: "lead" as LeadStage,
  });

  React.useEffect(() => {
    if (lead) {
      setEditForm({
        firstName: lead.firstName || "",
        lastName: lead.lastName || "",
        email: lead.email || "",
        company: lead.company || "",
        source: lead.source || "",
        lifecycleStage: lead.lifecycleStage || "lead",
      });
    }
  }, [lead]);

  if (isLoading) {
    return (
      <main className="min-h-screen text-[#F1F5F9] p-6 md:p-10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#64748B]">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
          <span className="text-sm">Loading lead profile…</span>
        </div>
      </main>
    );
  }

  if (error || !lead) {
    return (
      <main className="min-h-screen text-[#F1F5F9] p-6 md:p-10">
        <div className="max-w-[1000px] mx-auto">
          <Link href="/leads" className="inline-flex items-center text-sm text-[#64748B] hover:text-[#F1F5F9] mb-6">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Leads
          </Link>
          <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-300">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div>
              <h3 className="font-semibold text-lg">Lead Not Found</h3>
              <p className="text-sm text-rose-300/80">The lead you are looking for does not exist or has been removed.</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    await addNoteMutation.mutateAsync(noteText);
    setNoteText("");
  }

  async function handleSaveEdit() {
    await updateLeadMutation.mutateAsync(editForm);
    setEditing(false);
  }

  const emailConsent = lead.consents?.find((c) => c.type === "email");
  const smsConsent = lead.consents?.find((c) => c.type === "sms");

  return (
    <main className="min-h-screen text-[#F1F5F9] p-6 md:p-10">
      <div className="max-w-[1200px] mx-auto">
        {/* Navigation Top */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/leads" className="inline-flex items-center text-sm text-[#64748B] hover:text-[#F1F5F9] transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Leads
          </Link>
          <div className="flex gap-2">
            {editing ? (
              <Button
                onClick={handleSaveEdit}
                disabled={updateLeadMutation.isPending}
                className="h-9 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm rounded-lg"
              >
                {updateLeadMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                Save Changes
              </Button>
            ) : (
              <Button
                onClick={() => setEditing(true)}
                variant="outline"
                className="h-9 px-4 border-white/[0.12] text-[#94A3B8] bg-transparent hover:bg-white/5 hover:text-[#F1F5F9] text-sm rounded-lg"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Lead Profile Header */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shrink-0">
                {(lead.firstName?.[0] || lead.email[0]).toUpperCase()}
              </div>
              <div>
                {editing ? (
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={editForm.firstName}
                      onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                      placeholder="First name"
                      className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] h-8 text-sm w-36"
                    />
                    <Input
                      value={editForm.lastName}
                      onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                      placeholder="Last name"
                      className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] h-8 text-sm w-36"
                    />
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold text-[#F1F5F9]">
                    {`${lead.firstName} ${lead.lastName}`.trim() || lead.email}
                  </h1>
                )}
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#64748B] mt-1">
                  <span className="flex items-center gap-1 font-mono text-sky-400">
                    <Mail className="w-3.5 h-3.5" /> {lead.email}
                  </span>
                  {lead.company && (
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" /> {lead.company}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" /> {lead.source}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t md:border-t-0 border-white/[0.08] pt-4 md:pt-0">
              <div>
                <div className="text-xs text-[#64748B] uppercase tracking-wider mb-1">Stage</div>
                {editing ? (
                  <select
                    value={editForm.lifecycleStage}
                    onChange={(e) => setEditForm((p) => ({ ...p, lifecycleStage: e.target.value as LeadStage }))}
                    className="h-8 bg-[#0B0F1A] border border-white/[0.08] text-[#F1F5F9] text-xs rounded-lg px-2"
                  >
                    <option value="subscriber">Subscriber</option>
                    <option value="lead">Lead</option>
                    <option value="mql">MQL</option>
                    <option value="sql">SQL</option>
                    <option value="customer">Customer</option>
                  </select>
                ) : (
                  <Badge className={cn("text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md", stageBadgeClasses[lead.lifecycleStage])}>
                    {lead.lifecycleStage}
                  </Badge>
                )}
              </div>

              <div>
                <div className="text-xs text-[#64748B] uppercase tracking-wider mb-1">Score</div>
                <div className="text-xl font-bold font-mono text-emerald-400">{lead.score}</div>
              </div>

              <div>
                <div className="text-xs text-[#64748B] uppercase tracking-wider mb-1">Status</div>
                <Badge variant="outline" className="text-xs border-white/[0.12] text-[#94A3B8] uppercase">
                  {lead.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout: Main + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Timeline / Notes / Custom Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex border-b border-white/[0.08] gap-6">
              <button
                onClick={() => setActiveTab("timeline")}
                className={cn(
                  "pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors",
                  activeTab === "timeline" ? "border-sky-400 text-sky-400" : "border-transparent text-[#64748B] hover:text-[#F1F5F9]",
                )}
              >
                <Activity className="w-4 h-4" /> Activity Timeline
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={cn(
                  "pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors",
                  activeTab === "notes" ? "border-sky-400 text-sky-400" : "border-transparent text-[#64748B] hover:text-[#F1F5F9]",
                )}
              >
                <MessageSquare className="w-4 h-4" /> Notes ({lead.notes?.length ?? 0})
              </button>
              <button
                onClick={() => setActiveTab("custom_fields")}
                className={cn(
                  "pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors",
                  activeTab === "custom_fields" ? "border-sky-400 text-sky-400" : "border-transparent text-[#64748B] hover:text-[#F1F5F9]",
                )}
              >
                <Tag className="w-4 h-4" /> Custom Fields
              </button>
            </div>

            {/* Tab: Timeline */}
            {activeTab === "timeline" && (
              <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 space-y-6">
                {lead.timeline && lead.timeline.length > 0 ? (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/[0.08]">
                    {lead.timeline.map((event) => (
                      <div key={event.id} className="relative">
                        <span className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-sky-400 ring-4 ring-[#111827]" />
                        <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
                          <span className="font-mono uppercase font-semibold text-sky-400">{event.type}</span>
                          <span>{new Date(event.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-[#F1F5F9]">{event.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-[#64748B]">No timeline activities recorded yet.</div>
                )}
              </div>
            )}

            {/* Tab: Notes */}
            {activeTab === "notes" && (
              <div className="space-y-6">
                <form onSubmit={handleAddNote} className="bg-[#111827] border border-white/[0.08] rounded-2xl p-4 flex gap-3">
                  <Input
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Write a note about this lead…"
                    className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] placeholder:text-[#64748B] text-sm h-10 flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={addNoteMutation.isPending || !noteText.trim()}
                    className="h-10 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm rounded-lg shrink-0"
                  >
                    {addNoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>

                <div className="space-y-3">
                  {lead.notes && lead.notes.length > 0 ? (
                    lead.notes.map((note) => (
                      <div key={note.id} className="bg-[#111827] border border-white/[0.08] rounded-2xl p-4">
                        <div className="flex items-center justify-between text-xs text-[#64748B] mb-2">
                          <span className="font-medium text-[#94A3B8]">{note.author}</span>
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-[#F1F5F9] whitespace-pre-wrap">{note.note}</p>
                      </div>
                    ))
                  ) : (
                    <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-8 text-center text-sm text-[#64748B]">
                      No notes created yet. Add one above.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Custom Fields */}
            {activeTab === "custom_fields" && (
              <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6">
                {Object.keys(lead.customFields || {}).length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(lead.customFields).map(([key, value]) => (
                      <div key={key} className="bg-[#0B0F1A] border border-white/[0.08] p-3 rounded-xl">
                        <div className="text-xs text-[#64748B] uppercase font-semibold tracking-wider mb-1">{key}</div>
                        <div className="text-sm text-[#F1F5F9] font-medium">{String(value)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-[#64748B]">No custom fields attached to this lead.</div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Consent Tracking & Meta */}
          <div className="space-y-6">
            {/* Consent Tracking */}
            <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-[#F1F5F9] mb-4 uppercase tracking-wider">Consent Tracking</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F1A] border border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    {emailConsent?.granted ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    )}
                    <span className="text-sm text-[#F1F5F9] font-medium">Email Subscription</span>
                  </div>
                  <button
                    onClick={() => updateConsentMutation.mutate({ type: "email", granted: !(emailConsent?.granted ?? false) })}
                    disabled={updateConsentMutation.isPending}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-semibold transition-colors",
                      emailConsent?.granted ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20",
                    )}
                  >
                    {emailConsent?.granted ? "Granted" : "Opted-out"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F1A] border border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    {smsConsent?.granted ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    )}
                    <span className="text-sm text-[#F1F5F9] font-medium">SMS Subscription</span>
                  </div>
                  <button
                    onClick={() => updateConsentMutation.mutate({ type: "sms", granted: !(smsConsent?.granted ?? false) })}
                    disabled={updateConsentMutation.isPending}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-semibold transition-colors",
                      smsConsent?.granted ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20",
                    )}
                  >
                    {smsConsent?.granted ? "Granted" : "Opted-out"}
                  </button>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-[#F1F5F9] mb-4 uppercase tracking-wider">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {lead.tags && lead.tags.length > 0 ? (
                  lead.tags.map((t) => (
                    <span key={t} className="px-2.5 py-1 bg-[#0B0F1A] border border-white/[0.08] rounded-lg text-xs text-[#94A3B8] font-medium">
                      #{t}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#64748B]">No tags assigned.</span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
