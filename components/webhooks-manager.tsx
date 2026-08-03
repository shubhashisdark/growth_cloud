"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Webhook, Plus, RefreshCw, Eye, EyeOff, Copy, Check, Play, RotateCw,
  Trash2, Activity, CheckCircle2, XCircle, AlertTriangle, Clock, ArrowRight, CornerUpLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthSessionStore } from "@/lib/stores/auth-session";
import {
  useWebhooks,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useRotateWebhookSecret,
  useWebhookDeliveryLogs,
  useReplayWebhookDelivery,
  useTestDispatchWebhook,
  type WebhookSubscription,
  type WebhookDeliveryLog,
} from "@/hooks/useWebhooks";
import { cn } from "@/lib/utils";

const AVAILABLE_EVENTS = [
  { id: "lead.created", label: "Lead Created" },
  { id: "lead.updated", label: "Lead Updated" },
  { id: "lead.score_changed", label: "Score Changed" },
  { id: "campaign.sent", label: "Campaign Sent" },
  { id: "workflow.completed", label: "Workflow Completed" },
  { id: "email.opened", label: "Email Opened" },
  { id: "email.clicked", label: "Email Clicked" },
  { id: "*", label: "All Events (*)" },
];

export function WebhooksManager() {
  const session = useAuthSessionStore((s) => s.session);
  const workspaceId = session?.user?.memberships?.[0]?.workspaceId ?? "";

  const { data, isLoading, refetch } = useWebhooks(workspaceId);
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const rotateSecret = useRotateWebhookSecret();
  const testDispatch = useTestDispatchWebhook();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedSub, setSelectedSub] = useState<WebhookSubscription | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["lead.created", "lead.score_changed"]);
  const [formError, setFormError] = useState<string | null>(null);

  const subscriptions = data?.items ?? [];

  const handleCreate = async () => {
    if (!name.trim() || !targetUrl.trim() || selectedEvents.length === 0) {
      setFormError("Please fill out name, target URL, and at least one event.");
      return;
    }
    setFormError(null);

    try {
      await createWebhook.mutateAsync({
        workspaceId,
        name,
        targetUrl,
        events: selectedEvents,
      });
      setName("");
      setTargetUrl("");
      setSelectedEvents(["lead.created"]);
      setShowCreate(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create webhook subscription.");
    }
  };

  const handleCopySecret = (id: string, secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRotateSecret = async (id: string) => {
    if (!confirm("Rotate secret? Existing HMAC signatures using the old secret will become invalid.")) return;
    await rotateSecret.mutateAsync({ id, workspaceId });
  };

  const handleToggleEvent = (eventId: string) => {
    if (eventId === "*") {
      setSelectedEvents((prev) => (prev.includes("*") ? [] : ["*"]));
      return;
    }
    setSelectedEvents((prev) => {
      const filtered = prev.filter((e) => e !== "*");
      if (filtered.includes(eventId)) {
        return filtered.filter((e) => e !== eventId);
      }
      return [...filtered, eventId];
    });
  };

  const handleTestDispatch = async (sub: WebhookSubscription) => {
    await testDispatch.mutateAsync({
      workspaceId,
      event: sub.events[0] || "lead.created",
      payload: { test: true, webhookId: sub.id, time: new Date().toISOString() },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#F1F5F9] flex items-center gap-2">
            <Webhook className="w-5 h-5 text-[#38BDF8]" /> Webhook Subscriptions
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Deliver signed real-time HMAC events to your external APIs & integrations
          </p>
        </div>

        <Button
          onClick={() => setShowCreate((v) => !v)}
          className="bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#0B0F1A] font-semibold hover:opacity-90 h-9 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Webhook Endpoint
        </Button>
      </div>

      {/* Create Modal / Form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[#38BDF8]/20 bg-[#38BDF8]/5 p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-[#38BDF8]">New Webhook Endpoint</h3>

          {formError && <p className="text-xs text-[#F87171] font-medium">{formError}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#64748B] mb-1 block">Endpoint Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Production CRM Sync"
                className="h-9 bg-[#070A14] border-white/8 text-[#F1F5F9] text-xs"
              />
            </div>

            <div>
              <label className="text-xs text-[#64748B] mb-1 block">Target Endpoint URL *</label>
              <Input
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://api.yourcompany.com/webhooks"
                className="h-9 bg-[#070A14] border-white/8 text-[#F1F5F9] text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#64748B] mb-2 block">Event Subscriptions *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AVAILABLE_EVENTS.map((ev) => {
                const checked = selectedEvents.includes(ev.id);
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => handleToggleEvent(ev.id)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border text-xs text-left transition-all",
                      checked
                        ? "border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8]"
                        : "border-white/8 bg-[#070A14] text-[#64748B] hover:border-white/20"
                    )}
                  >
                    <div className={cn("w-3.5 h-3.5 rounded flex items-center justify-center border", checked ? "border-[#38BDF8] bg-[#38BDF8] text-[#0B0F1A]" : "border-white/20")}>
                      {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className="truncate">{ev.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="h-8 text-xs text-[#64748B]">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createWebhook.isPending}
              className="bg-[#38BDF8] text-[#0B0F1A] font-semibold hover:bg-[#38BDF8]/90 h-8 px-4 text-xs"
            >
              {createWebhook.isPending ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : null} Save Subscription
            </Button>
          </div>
        </motion.div>
      )}

      {/* Subscriptions List */}
      <div className="rounded-2xl border border-white/8 bg-[#0D1117] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <span className="text-sm font-medium text-[#F1F5F9]">Active Endpoints ({subscriptions.length})</span>
          <button onClick={() => refetch()} className="text-[#64748B] hover:text-[#38BDF8] transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-[#64748B] text-xs">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading webhooks...
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-[#64748B]">
            <Webhook className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm font-medium text-[#F1F5F9]">No webhook subscriptions</p>
            <p className="text-xs mt-1">Add a target URL to start receiving signed event payloads</p>
          </div>
        ) : (
          <div className="divide-y divide-white/6">
            {subscriptions.map((sub) => {
              const isRevealed = revealedSecrets[sub.id];
              return (
                <div key={sub.id} className="p-5 space-y-3 hover:bg-white/2 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#F1F5F9]">{sub.name}</span>
                        <Badge
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-medium border",
                            sub.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          )}
                        >
                          {sub.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#38BDF8] font-mono mt-1 break-all">{sub.targetUrl}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-[#64748B] hover:text-[#38BDF8]"
                        onClick={() => handleTestDispatch(sub)}
                        disabled={testDispatch.isPending}
                        title="Send Test Payload"
                      >
                        <Play className="w-3 h-3 mr-1" /> Test
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-[#64748B] hover:text-[#818CF8]"
                        onClick={() => setSelectedSub(sub)}
                        title="View Delivery Logs"
                      >
                        <Activity className="w-3 h-3 mr-1" /> Logs
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-[#64748B] hover:text-[#F87171]"
                        onClick={() => deleteWebhook.mutate({ id: sub.id, workspaceId })}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Secret & Events */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/6 text-xs">
                    {/* Secret display */}
                    <div className="flex items-center gap-2 bg-[#070A14] border border-white/6 p-2 rounded-xl">
                      <span className="text-[#64748B] shrink-0 font-medium">Secret:</span>
                      <span className="font-mono text-[#F1F5F9] truncate flex-1">
                        {isRevealed ? sub.secret : `${sub.secret.slice(0, 8)}...`}
                      </span>
                      <button
                        onClick={() => setRevealedSecrets((prev) => ({ ...prev, [sub.id]: !prev[sub.id] }))}
                        className="text-[#64748B] hover:text-[#F1F5F9] p-1"
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleCopySecret(sub.id, sub.secret)}
                        className="text-[#64748B] hover:text-[#38BDF8] p-1"
                        title="Copy Secret"
                      >
                        {copiedId === sub.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleRotateSecret(sub.id)}
                        className="text-[#64748B] hover:text-yellow-400 p-1"
                        title="Rotate Secret"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Events list */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[#64748B] font-medium">Events:</span>
                      {sub.events.map((ev) => (
                        <span key={ev} className="bg-[#1E2538] text-[#94A3B8] border border-white/6 px-2 py-0.5 rounded text-[11px] font-mono">
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delivery Logs Modal / Drawer */}
      {selectedSub && (
        <DeliveryLogsModal
          subscription={selectedSub}
          workspaceId={workspaceId}
          onClose={() => setSelectedSub(null)}
        />
      )}
    </div>
  );
}

function DeliveryLogsModal({
  subscription,
  workspaceId,
  onClose,
}: {
  subscription: WebhookSubscription;
  workspaceId: string;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useWebhookDeliveryLogs(subscription.id, page);
  const replayDelivery = useReplayWebhookDelivery();
  const [replayingId, setReplayingId] = useState<string | null>(null);

  const logs = data?.items ?? [];

  const handleReplay = async (deliveryId: string) => {
    setReplayingId(deliveryId);
    try {
      await replayDelivery.mutateAsync({ deliveryId, workspaceId });
      refetch();
    } finally {
      setReplayingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0D1117] text-[#F1F5F9] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#38BDF8]" /> Delivery Logs: {subscription.name}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">{subscription.targetUrl}</p>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#F1F5F9]">✕</button>
        </div>

        {/* Logs list */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12 text-xs text-[#64748B]">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading delivery logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#64748B]">
              No delivery logs recorded for this endpoint yet.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="rounded-xl border border-white/6 bg-[#070A14] p-4 text-xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-semibold text-xs px-2 py-0.5 rounded border",
                      log.status === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-[#F87171] border-red-500/20"
                    )}>
                      {log.statusCode ?? "ERR"}
                    </span>
                    <span className="font-mono font-medium text-[#38BDF8]">{log.event}</span>
                    <span className="text-[#64748B]">Attempt {log.attempt}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[#64748B]">{log.durationMs ? `${log.durationMs}ms` : "-"}</span>
                    <span className="text-[#64748B]">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[11px] text-[#38BDF8] hover:bg-[#38BDF8]/10"
                      onClick={() => handleReplay(log.id)}
                      disabled={replayingId === log.id}
                    >
                      {replayingId === log.id ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <CornerUpLeft className="w-3 h-3 mr-1" />} Replay
                    </Button>
                  </div>
                </div>

                {log.errorMessage && (
                  <p className="text-[#F87171] text-[11px] font-mono">{log.errorMessage}</p>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/6 text-[11px]">
                  <div>
                    <span className="text-[#64748B] block mb-1">Payload Sent</span>
                    <pre className="p-2 rounded bg-[#0D1117] text-[#94A3B8] font-mono overflow-auto max-h-24">{log.payloadJson}</pre>
                  </div>
                  <div>
                    <span className="text-[#64748B] block mb-1">Response Body</span>
                    <pre className="p-2 rounded bg-[#0D1117] text-[#94A3B8] font-mono overflow-auto max-h-24">{log.responseBody || "(empty)"}</pre>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/8 flex justify-end">
          <Button variant="ghost" onClick={onClose} className="h-8 text-xs text-[#64748B]">
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
