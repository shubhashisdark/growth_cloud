"use client";

import Link from "next/link";
import { ChevronLeft, MailX, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCampaigns } from "@/hooks/useCampaigns";

export default function UnsubscribedPage() {
  const { suppressions, isLoadingSuppressions, removeSuppressionMutation } = useCampaigns();

  return (
    <main className="min-h-screen text-[#F1F5F9] p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#F1F5F9] transition-colors mb-3"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to Campaigns
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Unsubscribed</h1>
          <p className="text-sm text-[#64748B] mt-1">
            People who clicked Unsubscribe in a campaign email. They are skipped on future sends.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
            <div className="text-sm font-semibold text-[#F1F5F9]">
              {isLoadingSuppressions ? "Loading…" : `${suppressions.length} unsubscribed`}
            </div>
          </div>

          {isLoadingSuppressions ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#64748B]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading suppressions…
            </div>
          ) : suppressions.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <MailX className="w-8 h-8 text-[#64748B] mx-auto" />
              <p className="text-sm text-[#64748B]">No one has unsubscribed yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {suppressions.map((item) => (
                <div key={item.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#F1F5F9] truncate">{item.email}</div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">
                      {item.reason || "unsubscribe"} · {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={removeSuppressionMutation.isPending}
                    onClick={() => removeSuppressionMutation.mutate(item.id)}
                    className="h-8 border-white/[0.12] text-[#94A3B8] bg-transparent hover:bg-emerald-500/10 hover:text-emerald-300 shrink-0"
                  >
                    <RotateCcw className="w-3 h-3 mr-1.5" />
                    Re-subscribe
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
