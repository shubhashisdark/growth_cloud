"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCampaignDetail } from "@/hooks/useCampaigns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Mail,
  Send,
  Eye,
  MousePointer,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
} from "lucide-react";

function formatPct(value: number) {
  return `${value.toFixed(1)}%`;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = typeof params?.campaignId === "string" ? params.campaignId : null;
  const { campaign, isLoading, error } = useCampaignDetail(campaignId);

  if (isLoading) {
    return (
      <main className="min-h-screen text-[#F1F5F9] p-6 md:p-10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#64748B]">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
          <span className="text-sm">Loading campaign metrics…</span>
        </div>
      </main>
    );
  }

  if (error || !campaign) {
    return (
      <main className="min-h-screen text-[#F1F5F9] p-6 md:p-10">
        <div className="max-w-[1000px] mx-auto">
          <Link href="/campaigns" className="inline-flex items-center text-sm text-[#64748B] hover:text-[#F1F5F9] mb-6">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Campaigns
          </Link>
          <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-300">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div>
              <h3 className="font-semibold text-lg">Campaign Not Found</h3>
              <p className="text-sm text-rose-300/80">The requested campaign does not exist or has been removed.</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const openRate = campaign.sentCount > 0 ? (campaign.openCount / campaign.sentCount) * 100 : 0;
  const clickRate = campaign.sentCount > 0 ? (campaign.clickCount / campaign.sentCount) * 100 : 0;

  return (
    <main className="min-h-screen text-[#F1F5F9] p-6 md:p-10">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* Top Nav */}
        <Link href="/campaigns" className="inline-flex items-center text-sm text-[#64748B] hover:text-[#F1F5F9] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Campaigns
        </Link>

        {/* Header */}
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[#F1F5F9]">{campaign.name}</h1>
              <Badge variant="outline" className="text-xs uppercase border-white/[0.12] text-sky-400">
                {campaign.status}
              </Badge>
            </div>
            <p className="text-sm text-[#94A3B8] font-mono">Subject: {campaign.subject}</p>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#64748B] border-t md:border-t-0 border-white/[0.08] pt-4 md:pt-0">
            <div>
              <div className="uppercase font-semibold mb-0.5">From Name</div>
              <div className="text-sm text-[#F1F5F9] font-medium">{campaign.fromName}</div>
            </div>
            <div>
              <div className="uppercase font-semibold mb-0.5">Sent At</div>
              <div className="text-sm text-[#F1F5F9] font-medium font-mono">
                {campaign.sentAt ? new Date(campaign.sentAt).toLocaleString() : "Not sent yet"}
              </div>
            </div>
          </div>
        </div>

        {/* Deliverability Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5">
            <div className="text-2xl font-bold text-[#F1F5F9] font-mono mb-1">{campaign.totalRecipients.toLocaleString()}</div>
            <div className="text-xs text-[#64748B] uppercase tracking-wider font-semibold">Total Targeted</div>
          </div>
          <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5">
            <div className="text-2xl font-bold text-sky-400 font-mono mb-1">{campaign.sentCount.toLocaleString()}</div>
            <div className="text-xs text-[#64748B] uppercase tracking-wider font-semibold">Dispatched</div>
          </div>
          <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5">
            <div className="text-2xl font-bold text-purple-400 font-mono mb-1">{campaign.openCount.toLocaleString()} ({formatPct(openRate)})</div>
            <div className="text-xs text-[#64748B] uppercase tracking-wider font-semibold">Unique Opens</div>
          </div>
          <div className="bg-[#111827] border border-white/[0.08] rounded-xl p-5">
            <div className="text-2xl font-bold text-emerald-400 font-mono mb-1">{campaign.clickCount.toLocaleString()} ({formatPct(clickRate)})</div>
            <div className="text-xs text-[#64748B] uppercase tracking-wider font-semibold">Unique Clicks</div>
          </div>
        </div>

        {/* Content Tabs / Recipient Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recipient Job Logs */}
          <div className="lg:col-span-2 bg-[#111827] border border-white/[0.08] rounded-2xl p-6">
            <h3 className="text-base font-semibold text-[#F1F5F9] mb-4">Recipient Delivery Log</h3>
            
            {campaign.jobs && campaign.jobs.length > 0 ? (
              <div className="space-y-3">
                {campaign.jobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B0F1A] border border-white/[0.08]">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-sky-400" />
                      <div>
                        <div className="text-sm font-semibold text-[#F1F5F9]">{job.recipientEmail}</div>
                        <div className="text-xs text-[#64748B] font-mono">{job.sentAt ? new Date(job.sentAt).toLocaleTimeString() : "Queued"}</div>
                      </div>
                    </div>
                    <Badge className={cn("text-[10px] uppercase font-semibold", job.status === "sent" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300")}>
                      {job.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-[#64748B]">No recipient jobs dispatched for this campaign yet.</div>
            )}
          </div>

          {/* Activity Stream */}
          <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6">
            <h3 className="text-base font-semibold text-[#F1F5F9] mb-4">Live Tracking Stream</h3>

            {campaign.events && campaign.events.length > 0 ? (
              <div className="space-y-4">
                {campaign.events.map((evt) => (
                  <div key={evt.id} className="flex items-start gap-3 text-xs">
                    {evt.eventType === "open" ? (
                      <Eye className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    ) : (
                      <MousePointer className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="text-[#F1F5F9] font-medium">
                        {evt.recipientEmail} <span className="text-[#64748B] font-normal">{evt.eventType === "open" ? "opened email" : "clicked link"}</span>
                      </div>
                      <div className="text-[#64748B] font-mono text-[10px] mt-0.5">{new Date(evt.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-[#64748B]">No opens or clicks tracked yet.</div>
            )}
          </div>

        </div>

      </div>
    </main>
  );
}
