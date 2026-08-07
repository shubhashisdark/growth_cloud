"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Plus,
  Send,
  Calendar,
  FileText,
  Trash2,
  Loader2,
  AlertCircle,
  Mail,
  CheckCircle2,
  MousePointer,
  Eye,
  ShieldAlert,
} from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import type { EmailCampaignItem } from "@/lib/backend";

function statusStyles(status: EmailCampaignItem["status"]) {
  switch (status) {
    case "sent":
      return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20";
    case "sending":
      return "bg-sky-500/10 text-sky-300 border border-sky-500/20";
    case "scheduled":
      return "bg-amber-500/10 text-amber-300 border border-amber-500/20";
    case "paused":
      return "bg-amber-500/10 text-amber-300 border border-amber-500/20";
    case "draft":
      return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
  }
}

function formatPct(value: number) {
  return `${value.toFixed(1)}%`;
}

function StatCard({
  label,
  value,
  subtext,
  color,
  delay,
}: {
  label: string;
  value: string;
  subtext: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      className="bg-[#111827] border border-white/[0.08] rounded-xl p-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="text-[28px] font-bold tracking-tight mb-1" style={{ color }}>
        {value}
      </div>
      <div className="text-xs text-[#64748B] uppercase tracking-widest font-semibold">{label}</div>
      <div className="text-xs font-medium mt-1.5 text-[#94A3B8]">{subtext}</div>
    </motion.div>
  );
}

function CreateCampaignDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    subject: "",
    fromName: "Growth Cloud",
    templateId: "",
  });

  const { templates, createCampaignMutation } = useCampaigns();
  const error = createCampaignMutation.error?.message ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createCampaignMutation.mutateAsync({
      name: form.name,
      subject: form.subject,
      fromName: form.fromName,
      templateId: form.templateId || undefined,
    });
    setOpen(false);
    setForm({ name: "", subject: "", fromName: "Growth Cloud", templateId: "" });
    onCreated?.();
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-9 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm rounded-lg"
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        New Campaign
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#111827] border-white/[0.08] text-[#F1F5F9] max-w-md">
          <DialogHeader>
            <DialogTitle>Create Email Campaign</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs text-[#64748B] mb-1">Campaign Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                placeholder="August Product Announcement"
                className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] h-9 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-[#64748B] mb-1">Subject Line *</label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                required
                placeholder="Exciting new features have arrived! {{firstName}}"
                className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] h-9 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-[#64748B] mb-1">Sender Name</label>
              <Input
                value={form.fromName}
                onChange={(e) => setForm((p) => ({ ...p, fromName: e.target.value }))}
                placeholder="Growth Cloud"
                className="bg-[#0B0F1A] border-white/[0.08] text-[#F1F5F9] h-9 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-[#64748B] mb-1">Email Template</label>
              <select
                value={form.templateId}
                onChange={(e) => setForm((p) => ({ ...p, templateId: e.target.value }))}
                className="w-full h-9 rounded-lg bg-[#0B0F1A] border border-white/[0.08] text-[#F1F5F9] text-sm px-3"
              >
                <option value="">No Template (Plain Subject)</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-[#64748B]">Cancel</Button>
              <Button type="submit" disabled={createCampaignMutation.isPending} className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold">
                {createCampaignMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : "Create Draft"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function CampaignsPage() {
  const { campaigns, isLoading, error, sendCampaignMutation, deleteCampaignMutation } = useCampaigns();

  const metrics = React.useMemo(() => {
    const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
    const totalOpened = campaigns.reduce((sum, c) => sum + c.openCount, 0);
    const totalClicked = campaigns.reduce((sum, c) => sum + c.clickCount, 0);
    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    return { totalSent, totalOpened, totalClicked, openRate, clickRate };
  }, [campaigns]);

  return (
    <main className="min-h-screen text-[#F1F5F9] p-6 md:p-10">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight">Campaigns</h1>
            <p className="text-sm text-[#64748B] mt-1">
              Create, schedule, and send targeted email campaigns to your leads.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/campaigns/templates">
              <Button variant="outline" className="h-9 px-4 border-white/[0.12] text-[#94A3B8] bg-transparent hover:bg-white/5 hover:text-[#F1F5F9] text-sm rounded-lg">
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Templates
              </Button>
            </Link>
            <CreateCampaignDialog />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error instanceof Error ? error.message : "Failed to load campaigns"}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Campaigns" value={campaigns.length.toLocaleString()} subtext="Total campaigns created" color="#F1F5F9" delay={0} />
          <StatCard label="Messages Sent" value={metrics.totalSent.toLocaleString()} subtext="Dispatched via queue" color="#38BDF8" delay={0.08} />
          <StatCard label="Avg. Open Rate" value={formatPct(metrics.openRate)} subtext="Tracked pixel opens" color="#A78BFA" delay={0.16} />
          <StatCard label="Avg. Click Rate" value={formatPct(metrics.clickRate)} subtext="Link clickthroughs" color="#34D399" delay={0.24} />
        </div>

        {/* Campaigns Table */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/[0.08]">
            <div className="text-base font-semibold text-[#F1F5F9]">All Email Campaigns</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#1A1F2E] text-left">
                  <th className="px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-widest font-semibold">Campaign Name</th>
                  <th className="px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-widest font-semibold">Status</th>
                  <th className="px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-widest font-semibold">Subject Line</th>
                  <th className="px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-widest font-semibold text-right">Sent</th>
                  <th className="px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-widest font-semibold text-right">Opens</th>
                  <th className="px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-widest font-semibold text-right">Clicks</th>
                  <th className="px-5 py-3 text-[11px] text-[#64748B] uppercase tracking-widest font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/[0.08]">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-5 py-4"><div className="h-4 bg-white/[0.04] rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-[#64748B]">
                      No campaigns created yet. Click <strong>"New Campaign"</strong> above to get started.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => {
                    const openRate = campaign.sentCount > 0 ? (campaign.openCount / campaign.sentCount) * 100 : 0;
                    const clickRate = campaign.sentCount > 0 ? (campaign.clickCount / campaign.sentCount) * 100 : 0;
                    return (
                      <tr key={campaign.id} className="border-b border-white/[0.08] hover:bg-white/[0.025] transition-colors">
                        <td className="px-5 py-3.5">
                          <Link href={`/campaigns/${campaign.id}`} className="text-sm font-semibold text-[#F1F5F9] hover:text-sky-300 transition-colors">
                            {campaign.name}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md", statusStyles(campaign.status))}>
                            {campaign.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#94A3B8] truncate max-w-[260px]">{campaign.subject}</td>
                        <td className="px-5 py-3.5 text-sm text-[#94A3B8] text-right font-mono">{campaign.sentCount.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="text-sm font-medium text-[#F1F5F9] font-mono">{campaign.openCount.toLocaleString()}</div>
                          <div className="text-[11px] text-sky-400 font-mono">{formatPct(openRate)}</div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="text-sm font-medium text-[#F1F5F9] font-mono">{campaign.clickCount.toLocaleString()}</div>
                          <div className="text-[11px] text-emerald-400 font-mono">{formatPct(clickRate)}</div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {campaign.status !== "sent" && (
                              <Button
                                size="sm"
                                onClick={() => sendCampaignMutation.mutate(campaign.id)}
                                disabled={sendCampaignMutation.isPending}
                                className="h-7 px-2.5 text-xs bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-md"
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Send Now
                              </Button>
                            )}
                            <button
                              onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                              className="p-1 rounded text-[#64748B] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete Campaign"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {sendCampaignMutation.isError && sendCampaignMutation.variables === campaign.id && (
                            <div className="mt-1 text-[11px] text-rose-300 max-w-[180px] text-right">
                              {sendCampaignMutation.error.message}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
