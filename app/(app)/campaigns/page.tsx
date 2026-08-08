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
  FileText,
  Trash2,
  Loader2,
  AlertCircle,
  Mail,
  MousePointer,
  Eye,
  Sparkles,
  LayoutTemplate,
  Wand2,
  MailX,
} from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { runAiTool, type EmailCampaignItem } from "@/lib/backend";
import { useAuthSessionStore } from "@/lib/stores/auth-session";

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

const STARTER_TEMPLATES = [
  {
    id: "welcome",
    name: "Welcome email",
    subject: "Welcome to {{company}} — let's get started, {{firstName}}",
    description: "Onboard new leads with a warm hello and clear next step.",
    htmlContent: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;">
        <h1 style="font-size:24px;margin-bottom:12px;">Welcome, {{firstName}} 🎉</h1>
        <p>We're excited to have you with us. Your journey starts here.</p>
        <p>Explore the platform, connect your tools, and start growing with confidence.</p>
        <p style="margin:24px 0;">
          <a href="https://example.com" style="background:#38BDF8;color:#0B0F1A;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700;">Get Started</a>
        </p>
        <p style="font-size:12px;color:#64748B;">Sent to {{email}}</p>
      </div>
    `.trim(),
  },
  {
    id: "product-launch",
    name: "Product launch",
    subject: "Something new for you, {{firstName}}",
    description: "Announce a feature or product with a strong CTA.",
    htmlContent: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;">
        <h1 style="font-size:24px;margin-bottom:12px;">Introducing our latest update</h1>
        <p>Hi {{firstName}},</p>
        <p>We just launched something built for teams like {{company}}.</p>
        <ul>
          <li>Faster workflows</li>
          <li>Smarter insights</li>
          <li>Better conversion tracking</li>
        </ul>
        <p style="margin:24px 0;">
          <a href="https://example.com" style="background:#818CF8;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700;">See What's New</a>
        </p>
      </div>
    `.trim(),
  },
  {
    id: "nurture",
    name: "Nurture / tip",
    subject: "{{firstName}}, a quick tip to move forward",
    description: "Helpful nurture email for warm leads.",
    htmlContent: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;">
        <h1 style="font-size:22px;margin-bottom:12px;">A tip for {{firstName}}</h1>
        <p>Teams that move faster usually start with one focused action.</p>
        <p>Today: review your highest-intent leads and send a personal follow-up.</p>
        <p style="margin:24px 0;">
          <a href="https://example.com" style="background:#34D399;color:#0B0F1A;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700;">Open Dashboard</a>
        </p>
      </div>
    `.trim(),
  },
  {
    id: "reengage",
    name: "Re-engagement",
    subject: "Still interested, {{firstName}}?",
    description: "Win back quiet leads with a simple check-in.",
    htmlContent: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;">
        <h1 style="font-size:22px;margin-bottom:12px;">We saved your spot</h1>
        <p>Hi {{firstName}},</p>
        <p>It's been a while. If growth is still on your mind, we can help {{company}} pick up where you left off.</p>
        <p style="margin:24px 0;">
          <a href="https://example.com" style="background:#F59E0B;color:#0B0F1A;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700;">Come Back</a>
        </p>
      </div>
    `.trim(),
  },
];

function parseAiEmailOutput(output: string): {
  subject: string;
  htmlContent: string;
  textContent?: string;
} | null {
  const trimmed = output.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] || trimmed).trim();
  const jsonMatch = candidate.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      subject?: string;
      htmlContent?: string;
      textContent?: string;
      body?: string;
      ctaLabel?: string;
      ctaUrl?: string;
    };

    const subject = parsed.subject?.trim();
    let htmlContent = parsed.htmlContent?.trim() || parsed.body?.trim();
    if (!subject || !htmlContent) return null;

    if (!/<[a-z][\s\S]*>/i.test(htmlContent)) {
      const ctaLabel = parsed.ctaLabel || "Learn More";
      const ctaUrl = parsed.ctaUrl || "https://example.com";
      htmlContent = `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;">
          <p>${htmlContent.replace(/\n/g, "<br/>")}</p>
          <p style="margin:24px 0;">
            <a href="${ctaUrl}" style="background:#38BDF8;color:#0B0F1A;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700;">${ctaLabel}</a>
          </p>
        </div>
      `.trim();
    }

    return {
      subject,
      htmlContent,
      textContent: parsed.textContent,
    };
  } catch {
    return null;
  }
}

function CreateCampaignDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"starter" | "ai" | "saved">("starter");
  const [form, setForm] = React.useState({
    name: "",
    subject: "",
    fromName: "Growth Cloud",
    templateId: "",
  });
  const [aiGoal, setAiGoal] = React.useState("Increase engagement and conversions");
  const [aiAudience, setAiAudience] = React.useState("Active leads in my workspace");
  const [aiTone, setAiTone] = React.useState("excited and professional");
  const [aiContext, setAiContext] = React.useState("");
  const [aiBusy, setAiBusy] = React.useState(false);
  const [aiPreviewHtml, setAiPreviewHtml] = React.useState<string | null>(null);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [selectedStarterId, setSelectedStarterId] = React.useState<string | null>(null);

  const session = useAuthSessionStore((s) => s.session);
  const token = session?.accessToken ?? "";
  const workspaceId = session?.workspaceId || session?.user?.memberships?.[0]?.workspaceId || "";

  const { templates, createCampaignMutation, createTemplateMutation } = useCampaigns();
  const error = createCampaignMutation.error?.message ?? createTemplateMutation.error?.message ?? "";

  function resetState() {
    setForm({ name: "", subject: "", fromName: "Growth Cloud", templateId: "" });
    setMode("starter");
    setSelectedStarterId(null);
    setAiPreviewHtml(null);
    setAiError(null);
    setAiContext("");
  }

  async function applyStarter(starterId: string) {
    const starter = STARTER_TEMPLATES.find((t) => t.id === starterId);
    if (!starter) return;

    setSelectedStarterId(starterId);
    setAiBusy(true);
    setAiError(null);
    try {
      const created = await createTemplateMutation.mutateAsync({
        name: `${starter.name} · ${new Date().toLocaleDateString()}`,
        subject: starter.subject,
        htmlContent: starter.htmlContent,
        variables: ["firstName", "company", "email"],
      });
      const templateId = created.data.id;
      setForm((prev) => ({
        ...prev,
        subject: prev.subject || starter.subject,
        name: prev.name || starter.name,
        templateId,
      }));
      setAiPreviewHtml(starter.htmlContent);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to save starter template");
    } finally {
      setAiBusy(false);
    }
  }

  async function generateWithAi() {
    if (!workspaceId || !token) {
      setAiError("Sign in and select a workspace first.");
      return;
    }

    setAiBusy(true);
    setAiError(null);
    try {
      const response = await runAiTool(
        workspaceId,
        "email-generator",
        {
          goal: aiGoal,
          audience: aiAudience,
          tone: aiTone,
          subject: form.subject || undefined,
          context: aiContext || form.name || undefined,
        },
        token,
      );

      const parsed = parseAiEmailOutput(String(response.data?.output || ""));
      if (!parsed) {
        setAiError("AI returned an unreadable draft. Try again with a clearer goal.");
        return;
      }

      const created = await createTemplateMutation.mutateAsync({
        name: `AI · ${form.name || parsed.subject}`.slice(0, 80),
        subject: parsed.subject,
        htmlContent: parsed.htmlContent,
        textContent: parsed.textContent,
        variables: ["firstName", "company", "email"],
      });

      setForm((prev) => ({
        ...prev,
        subject: parsed.subject,
        templateId: created.data.id,
        name: prev.name || parsed.subject.slice(0, 48),
      }));
      setAiPreviewHtml(parsed.htmlContent);
      setSelectedStarterId(null);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setAiBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createCampaignMutation.mutateAsync({
      name: form.name,
      subject: form.subject,
      fromName: form.fromName,
      templateId: form.templateId || undefined,
    });
    setOpen(false);
    resetState();
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

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetState();
        }}
      >
        <DialogContent className="bg-[#111827] border-white/[0.08] text-[#F1F5F9] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Email Campaign</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {(error || aiError) && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {aiError || error}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/[0.08] bg-[#0B0F1A] p-1">
              {(
                [
                  { id: "starter", label: "Starters", icon: LayoutTemplate },
                  { id: "ai", label: "AI template", icon: Wand2 },
                  { id: "saved", label: "Saved", icon: Mail },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMode(tab.id)}
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                      mode === tab.id ? "bg-[#1A1F2E] text-[#F1F5F9]" : "text-[#64748B] hover:text-[#F1F5F9]",
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {mode === "starter" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STARTER_TEMPLATES.map((starter) => (
                  <button
                    key={starter.id}
                    type="button"
                    disabled={aiBusy}
                    onClick={() => void applyStarter(starter.id)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      selectedStarterId === starter.id
                        ? "border-sky-500/40 bg-sky-500/10"
                        : "border-white/[0.08] bg-[#0B0F1A] hover:border-white/20",
                    )}
                  >
                    <div className="text-sm font-semibold text-[#F1F5F9]">{starter.name}</div>
                    <div className="text-[11px] text-[#64748B] mt-1 leading-relaxed">{starter.description}</div>
                  </button>
                ))}
              </div>
            )}

            {mode === "ai" && (
              <div className="space-y-3 rounded-xl border border-white/[0.08] bg-[#0B0F1A] p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#F1F5F9]">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  Generate an AI email template
                </div>
                <div>
                  <label className="block text-xs text-[#64748B] mb-1">Goal</label>
                  <Input
                    value={aiGoal}
                    onChange={(e) => setAiGoal(e.target.value)}
                    className="bg-[#111827] border-white/[0.08] text-[#F1F5F9] h-9 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#64748B] mb-1">Audience</label>
                    <Input
                      value={aiAudience}
                      onChange={(e) => setAiAudience(e.target.value)}
                      className="bg-[#111827] border-white/[0.08] text-[#F1F5F9] h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#64748B] mb-1">Tone</label>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="w-full h-9 rounded-lg bg-[#111827] border border-white/[0.08] text-[#F1F5F9] text-sm px-3"
                    >
                      <option value="excited and professional">Excited & Professional</option>
                      <option value="formal and informative">Formal & Informative</option>
                      <option value="casual and friendly">Casual & Friendly</option>
                      <option value="urgent and persuasive">Urgent & Persuasive</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#64748B] mb-1">Extra context (optional)</label>
                  <textarea
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    rows={2}
                    placeholder="Offer details, CTA URL, product name..."
                    className="w-full rounded-lg bg-[#111827] border border-white/[0.08] text-[#F1F5F9] text-sm px-3 py-2 resize-none"
                  />
                </div>
                <Button
                  type="button"
                  disabled={aiBusy}
                  onClick={() => void generateWithAi()}
                  className="h-9 bg-violet-500 hover:bg-violet-400 text-white font-semibold"
                >
                  {aiBusy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1.5" />}
                  Generate with AI
                </Button>
                <p className="text-[11px] text-[#64748B]">
                  AI will draft a subject and email body, then save it as a reusable template for this campaign.
                </p>
              </div>
            )}

            {mode === "saved" && (
              <div>
                <label className="block text-xs text-[#64748B] mb-1">Choose saved template</label>
                <select
                  value={form.templateId}
                  onChange={(e) => {
                    const templateId = e.target.value;
                    const selected = templates.find((t) => t.id === templateId);
                    setForm((prev) => ({
                      ...prev,
                      templateId,
                      subject: selected?.subject || prev.subject,
                    }));
                    setAiPreviewHtml(selected?.htmlContent || null);
                  }}
                  className="w-full h-9 rounded-lg bg-[#0B0F1A] border border-white/[0.08] text-[#F1F5F9] text-sm px-3"
                >
                  <option value="">No Template (Plain Subject)</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <p className="text-[11px] text-[#64748B] mt-2">
                    No saved templates yet. Use Starters or AI template first.
                  </p>
                )}
              </div>
            )}

            {aiPreviewHtml && (
              <div className="rounded-xl border border-white/[0.08] bg-white p-4 text-[#111827] max-h-48 overflow-auto">
                <div className="text-[10px] uppercase tracking-wider text-[#64748B] mb-2">Preview</div>
                <div dangerouslySetInnerHTML={{ __html: aiPreviewHtml }} />
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

            {form.templateId && (
              <div className="text-[11px] text-emerald-300/90">
                Template attached and ready to send with this campaign.
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-[#64748B]">Cancel</Button>
              <Button
                type="submit"
                disabled={createCampaignMutation.isPending || aiBusy}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold"
              >
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
            <Link href="/campaigns/unsubscribed">
              <Button variant="outline" className="h-9 px-4 border-white/[0.12] text-[#94A3B8] bg-transparent hover:bg-white/5 hover:text-[#F1F5F9] text-sm rounded-lg">
                <MailX className="w-3.5 h-3.5 mr-1.5" />
                Unsubscribed
              </Button>
            </Link>
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
