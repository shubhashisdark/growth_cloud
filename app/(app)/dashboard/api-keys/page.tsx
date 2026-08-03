"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Key,
  Plus,
  RefreshCw,
  Slash,
  Trash2,
  Copy,
  Check,
  Eye,
  Shield,
  Clock,
  BarChart2,
  AlertTriangle,
  X,
  Loader2,
  Lock,
  Globe,
} from "lucide-react";
import { useApiKeys } from "@/hooks/useApiKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiKeySummary } from "@/lib/backend";

const availableScopes = [
  "auth:read",
  "workspaces:read",
  "workspaces:write",
  "users:write",
  "events:write",
  "identify:write",
  "api_keys:read",
  "api_keys:write",
  "api_usage:read",
];

function formatDate(value: string | null) {
  if (!value) return "Never";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function ApiKeysPage() {
  const {
    apiKeys,
    isLoadingKeys,
    createApiKey,
    rotateApiKey,
    revokeApiKey,
    deleteApiKey,
  } = useApiKeys();

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyType, setKeyType] = useState<"secret" | "public">("secret");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    "events:write",
    "identify:write",
  ]);
  const [expiration, setExpiration] = useState<string>("");
  const [creating, setCreating] = useState(false);

  // Secret Reveal Modal State
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Revoke Prompt State
  const [revokeTarget, setRevokeTarget] = useState<ApiKeySummary | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState(false);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<ApiKeySummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Rotate State
  const [rotatingId, setRotatingId] = useState<string | null>(null);

  const toggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName || selectedScopes.length === 0 || creating) return;

    setCreating(true);
    try {
      const res = await createApiKey({
        name: keyName,
        type: keyType,
        scopes: selectedScopes,
        expiresAt: expiration ? new Date(expiration).toISOString() : null,
      });

      setShowCreateModal(false);
      setKeyName("");
      setSelectedScopes(["events:write", "identify:write"]);
      setExpiration("");

      // Reveal plaintext secret
      setRevealedSecret(res.data.plaintextKey);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleRotateKey = async (apiKeyId: string) => {
    if (!confirm("Are you sure you want to rotate this API key? The previous key will be invalidated immediately.")) return;

    setRotatingId(apiKeyId);
    try {
      const res = await rotateApiKey(apiKeyId);
      setRevealedSecret(res.data.plaintextKey);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to rotate API key");
    } finally {
      setRotatingId(null);
    }
  };

  const handleRevokeKey = async () => {
    if (!revokeTarget || revoking) return;

    setRevoking(true);
    try {
      await revokeApiKey({ apiKeyId: revokeTarget.id, reason: revokeReason || undefined });
      setRevokeTarget(null);
      setRevokeReason("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to revoke API key");
    } finally {
      setRevoking(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    try {
      await deleteApiKey(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete API key");
    } finally {
      setDeleting(false);
    }
  };

  const handleCopySecret = () => {
    if (!revealedSecret) return;
    navigator.clipboard.writeText(revealedSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9] flex items-center gap-2">
            <Key className="w-6 h-6 text-[#38BDF8]" />
            <span>API Keys</span>
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Create, rotate, revoke, and inspect workspace-scoped SDK & secret keys.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/api-keys/usage"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-[#E2E8F0] hover:bg-white/10 transition-colors"
          >
            <BarChart2 className="w-4 h-4 text-[#818CF8]" />
            <span>View Telemetry</span>
          </Link>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="h-10 bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#0B0F1A] font-semibold hover:opacity-90 px-4 rounded-xl flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Key</span>
          </Button>
        </div>
      </div>

      {/* Keys List */}
      <div className="space-y-4">
        {isLoadingKeys ? (
          <div className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-12 text-center text-[#94A3B8] flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#38BDF8]" />
            <span>Loading API keys...</span>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-12 text-center space-y-3">
            <Key className="w-10 h-10 text-[#64748B] mx-auto" />
            <div className="text-base font-semibold text-[#F1F5F9]">No API Keys Found</div>
            <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
              Create a secret API key for server integrations or a public SDK key for browser event capture.
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#38BDF8] text-[#0B0F1A] font-semibold hover:bg-[#38BDF8]/90"
            >
              Create API Key
            </Button>
          </div>
        ) : (
          apiKeys.map((key) => (
            <div
              key={key.id}
              className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-6 transition-all hover:border-white/12 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-[#F1F5F9]">{key.name}</h2>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-medium flex items-center gap-1 ${
                        key.type === "secret"
                          ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                          : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      }`}
                    >
                      {key.type === "secret" ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      {key.type}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-medium ${
                        key.status === "active"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      }`}
                    >
                      {key.status}
                    </span>
                  </div>

                  <div className="mt-2 text-xs font-mono text-[#38BDF8] bg-[#070A14] px-3 py-1.5 rounded-lg border border-white/5 inline-block">
                    {key.prefix}••••••••••••••••••••
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#94A3B8]">
                    <div>
                      Last used: <strong className="text-[#CBD5E1]">{formatDate(key.lastUsedAt)}</strong>
                    </div>
                    <div>
                      Requests: <strong className="text-[#CBD5E1]">{key.usageCount}</strong>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {key.status === "active" && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={rotatingId === key.id}
                      onClick={() => handleRotateKey(key.id)}
                      className="text-xs text-[#CBD5E1] hover:text-[#F1F5F9] hover:bg-white/5 border border-white/8"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${rotatingId === key.id ? "animate-spin" : ""}`} />
                      Rotate
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRevokeTarget(key)}
                      className="text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20"
                    >
                      <Slash className="w-3.5 h-3.5 mr-1.5" />
                      Revoke
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(key)}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {/* Scopes */}
              <div className="pt-3 border-t border-white/5 flex flex-wrap gap-1.5">
                {key.scopes.map((scope) => (
                  <span
                    key={scope}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[#94A3B8]"
                  >
                    {scope}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE API KEY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-2xl border border-white/10 bg-[#0B0F1A] max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/8 pb-4">
              <h2 className="text-lg font-bold text-[#F1F5F9] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#38BDF8]" />
                <span>Create New API Key</span>
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-[#94A3B8] hover:text-[#F1F5F9]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Key Name</label>
                <Input
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Production Webhook Key"
                  required
                  className="h-11 bg-[#070A14] border-white/8 text-[#F1F5F9]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Key Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setKeyType("secret")}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-colors ${
                      keyType === "secret"
                        ? "border-[#38BDF8] bg-[#38BDF8]/10 text-[#F1F5F9]"
                        : "border-white/8 bg-[#070A14] text-[#94A3B8]"
                    }`}
                  >
                    <Lock className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-[#F1F5F9]">Secret Key</div>
                      <div className="text-[11px] text-[#94A3B8]">For server-to-server API requests (gc_live_...)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKeyType("public")}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-colors ${
                      keyType === "public"
                        ? "border-[#38BDF8] bg-[#38BDF8]/10 text-[#F1F5F9]"
                        : "border-white/8 bg-[#070A14] text-[#94A3B8]"
                    }`}
                  >
                    <Globe className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-[#F1F5F9]">Public Key</div>
                      <div className="text-[11px] text-[#94A3B8]">For client-side SDK event tracking (gc_pub_...)</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Scopes */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Permission Scopes</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {availableScopes.map((scope) => (
                    <label
                      key={scope}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                        selectedScopes.includes(scope)
                          ? "border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#F1F5F9]"
                          : "border-white/5 bg-[#070A14] text-[#94A3B8]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scope)}
                        onChange={() => toggleScope(scope)}
                        className="rounded border-white/10 bg-transparent text-[#38BDF8] focus:ring-0"
                      />
                      <span className="font-mono">{scope}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Expiration */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Expiration (Optional)</label>
                <Input
                  type="date"
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value)}
                  className="h-11 bg-[#070A14] border-white/8 text-[#F1F5F9]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/8">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className="text-[#94A3B8]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#0B0F1A] font-semibold hover:opacity-90 px-6"
                >
                  {creating ? "Generating..." : "Generate API Key"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLAINTEXT SECRET REVEAL MODAL */}
      {revealedSecret && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-2xl border border-emerald-500/30 bg-[#0B0F1A] max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-emerald-400">
              <Check className="w-6 h-6 p-1 rounded-full bg-emerald-500/20 border border-emerald-500/30" />
              <h2 className="text-lg font-bold text-[#F1F5F9]">API Key Generated</h2>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Copy this key now. For security, this plaintext secret will <strong>never be shown again</strong>.</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Plaintext Key</label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={revealedSecret}
                  className="h-11 bg-[#070A14] border-white/10 font-mono text-sm text-[#38BDF8]"
                />
                <Button
                  onClick={handleCopySecret}
                  className="h-11 px-4 bg-[#38BDF8] text-[#0B0F1A] hover:bg-[#38BDF8]/90 font-semibold shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setRevealedSecret(null)}
                className="w-full bg-[#1E2538] text-[#F1F5F9] hover:bg-[#2B354F] border border-white/8"
              >
                I have saved this key
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* REVOKE PROMPT MODAL */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-2xl border border-amber-500/30 bg-[#0B0F1A] max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#F1F5F9]">Revoke API Key</h2>
            <p className="text-xs text-[#94A3B8]">
              Are you sure you want to revoke <strong>{revokeTarget.name}</strong>? Any requests using this key will immediately fail.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#94A3B8]">Revocation Reason (Optional)</label>
              <Input
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="e.g. Credential rotation"
                className="h-10 bg-[#070A14] border-white/8 text-[#F1F5F9]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setRevokeTarget(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleRevokeKey}
                disabled={revoking}
                className="bg-amber-500 text-black hover:bg-amber-400 font-semibold"
              >
                {revoking ? "Revoking..." : "Revoke Key"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-2xl border border-rose-500/30 bg-[#0B0F1A] max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#F1F5F9]">Delete API Key</h2>
            <p className="text-xs text-[#94A3B8]">
              Permanently soft-delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleDeleteKey}
                disabled={deleting}
                className="bg-rose-500 text-white hover:bg-rose-400 font-semibold"
              >
                {deleting ? "Deleting..." : "Delete Key"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
