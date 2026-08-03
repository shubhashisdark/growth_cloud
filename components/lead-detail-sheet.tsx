"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Lead, LeadStage } from "@/lib/stores/leads";
import { aiSummary } from "@/lib/stores/leads";
import { cn } from "@/lib/utils";
import {
  Activity,
  MousePointerClick,
  Eye,
  Mail,
  Calendar,
  Send,
  MessageSquare,
  FileText,
  UserCheck,
  Zap,
  CircleCheck,
} from "lucide-react";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
  Subscriber:
    "bg-[rgba(56,189,248,0.10)] text-[#38BDF8] border border-[rgba(56,189,248,0.2)]",
  MQL: "bg-[rgba(167,139,250,0.10)] text-[#A78BFA] border border-[rgba(167,139,250,0.2)]",
  SQL: "bg-[rgba(52,211,153,0.10)] text-[#34D399] border border-[rgba(52,211,153,0.2)]",
  Customer:
    "bg-[rgba(251,191,36,0.10)] text-[#FBBF24] border border-[rgba(251,191,36,0.2)]",
};

function scoreColor(score: number) {
  if (score >= 80) return "#34D399";
  if (score >= 50) return "#A78BFA";
  return "#38BDF8";
}

function activityIcon(type: string) {
  if (type.includes("page_view") || type.includes("view")) return Eye;
  if (type.includes("click")) return MousePointerClick;
  if (type.includes("email")) return Mail;
  if (type.includes("meeting")) return Calendar;
  if (type.includes("send")) return Send;
  if (type.includes("chat")) return MessageSquare;
  if (type.includes("form")) return FileText;
  if (type.includes("conversion")) return UserCheck;
  if (type.includes("trial")) return Zap;
  return Activity;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeAgo(iso: string) {
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

export function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const summary = React.useMemo(() => {
    if (!lead) return null;
    return aiSummary(lead);
  }, [lead]);

  if (!lead || !summary) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-[#0B0F1A] border-l border-white/[0.08] text-[#F1F5F9] p-0 overflow-y-auto"
      >
        <div className="p-6 pb-4">
          <SheetHeader className="p-0 mb-6">
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: gradientFromName(lead.name) }}
              >
                {getInitials(lead.name)}
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg font-semibold text-[#F1F5F9] truncate">
                  {lead.name}
                </SheetTitle>
                <SheetDescription className="text-sm text-[#94A3B8] mt-0.5">
                  {lead.email}
                </SheetDescription>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-[#64748B]">{lead.company}</span>
                  <Badge
                    className={cn(
                      "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md",
                      stageBadgeClasses[lead.stage]
                    )}
                  >
                    {lead.stage}
                  </Badge>
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1">
              <div className="text-xs text-[#64748B] uppercase tracking-wider font-semibold mb-1">
                Lead Score
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-2xl font-bold"
                  style={{
                    color: scoreColor(lead.score),
                    fontFamily: "var(--font-geist-sans), sans-serif",
                  }}
                >
                  {lead.score}
                </span>
                <div className="flex-1 h-2 bg-white/[0.06] rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${Math.min(100, lead.score)}%`,
                      background: scoreColor(lead.score),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {lead.segments.map((seg) => (
              <span
                key={seg}
                className="px-2.5 py-1 bg-[#070A14] border border-white/[0.08] rounded-md text-xs text-[#94A3B8]"
              >
                {seg}
              </span>
            ))}
          </div>
          <div className="text-xs text-[#64748B] mb-4">
            Source: {lead.source} · Created {formatDate(lead.createdAt)} · Last active {formatTimeAgo(lead.lastActive)}
          </div>

          <Tabs defaultValue="activity" className="w-full">
            <TabsList variant="line" className="w-full bg-transparent border-b border-white/[0.08] rounded-none h-9 p-0">
              <TabsTrigger value="activity" className="rounded-none text-xs font-medium data-active:after:opacity-100 data-active:text-[#38BDF8]">
                Activity Timeline
              </TabsTrigger>
              <TabsTrigger value="attribution" className="rounded-none text-xs font-medium data-active:after:opacity-100 data-active:text-[#38BDF8]">
                Attribution Journey
              </TabsTrigger>
              <TabsTrigger value="ai" className="rounded-none text-xs font-medium data-active:after:opacity-100 data-active:text-[#38BDF8]">
                AI Summary
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-4 space-y-0">
              <div className="relative pl-6 border-l border-white/[0.08] space-y-6">
                {lead.activities
                  .slice()
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((activity, i) => {
                    const Icon = activityIcon(activity.type);
                    return (
                      <div key={i} className="relative">
                        <div className="absolute -left-[25px] top-0 w-5 h-5 rounded-full bg-[#1A1F2E] border border-white/[0.08] flex items-center justify-center">
                          <Icon className="w-2.5 h-2.5 text-[#38BDF8]" />
                        </div>
                        <div className="text-sm font-medium text-[#F1F5F9]">
                          {activity.description}
                        </div>
                        <div className="text-xs text-[#64748B] mt-0.5">
                          {formatDate(activity.timestamp)} · {formatTimeAgo(activity.timestamp)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </TabsContent>

            <TabsContent value="attribution" className="mt-4 space-y-4">
              {lead.attribution.map((attr, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#1A1F2E] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                    {i === 0 ? (
                      <CircleCheck className="w-3 h-3 text-[#34D399]" />
                    ) : (
                      <CircleCheck className="w-3 h-3 text-[#38BDF8]" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#F1F5F9]">
                      {attr.touchpoint}
                    </div>
                    <div className="text-xs text-[#94A3B8] mt-0.5">
                      {attr.channel}
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      {formatDate(attr.date)}
                    </div>
                  </div>
                </div>
              ))}
              {lead.attribution.length === 0 && (
                <div className="text-sm text-[#94A3B8]">No attribution events yet.</div>
              )}
            </TabsContent>

            <TabsContent value="ai" className="mt-4 space-y-4">
              <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5">
                <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                  Conversion Probability
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-white/[0.06]"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={scoreColor(summary.probability)}
                        strokeWidth="3"
                        strokeDasharray={`${summary.probability}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                      {summary.probability}%
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-[#94A3B8]">
                      {summary.probability >= 80
                        ? "High likelihood of conversion"
                        : summary.probability >= 50
                        ? "Moderate conversion potential"
                        : "Early stage — nurture required"}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                  AI Summary
                </div>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  {summary.summary}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
