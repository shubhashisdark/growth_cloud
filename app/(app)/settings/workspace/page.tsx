"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, Save, ChevronLeft, CheckCircle2, XCircle, Globe, Clock, ShieldCheck } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function WorkspaceSettingsPage() {
  const { workspace, updateWorkspace, isLoadingWorkspace } = useWorkspace();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setSlug(workspace.slug);
      setTimezone(workspace.timezone || "UTC");
    }
  }, [workspace]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setFeedback(null);
    try {
      await updateWorkspace({ name, slug, timezone });
      setFeedback({ type: "success", message: "Workspace settings updated successfully!" });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update workspace",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#F1F5F9] transition-colors mb-3"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Settings</span>
        </Link>
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Workspace Settings</h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Update workspace branding, slug, and timezone settings.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Info Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#94A3B8]">Plan Tier</div>
            <div className="text-sm font-semibold text-[#F1F5F9] capitalize">
              {workspace?.plan || "Trial"}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#94A3B8]">Status</div>
            <div className="text-sm font-semibold text-[#F1F5F9] capitalize">
              {workspace?.status || "Active"}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#94A3B8]">Timezone</div>
            <div className="text-sm font-semibold text-[#F1F5F9]">{workspace?.timezone || "UTC"}</div>
          </div>
        </div>
      </div>

      {/* Workspace Form */}
      <form onSubmit={handleSave} className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-6 space-y-6">
        <div className="flex items-center gap-2 text-[#F1F5F9] font-semibold text-lg border-b border-white/8 pb-4">
          <Building2 className="w-5 h-5 text-[#38BDF8]" />
          <span>General Preferences</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#E2E8F0]">Workspace Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-11 bg-[#070A14] border-white/8 text-[#F1F5F9]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#E2E8F0]">Workspace Slug</label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="h-11 bg-[#070A14] border-white/8 text-[#F1F5F9]"
            />
            <p className="text-xs text-[#64748B]">Used in API endpoints and SDK origin mapping.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#E2E8F0]">Default Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-white/8 bg-[#070A14] text-[#F1F5F9] text-sm focus:outline-none focus:border-[#38BDF8]"
            >
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">Eastern Time (US & Canada)</option>
              <option value="America/Chicago">Central Time (US & Canada)</option>
              <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Asia/Kolkata">Kolkata (IST)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-white/8 flex justify-end">
          <Button
            type="submit"
            disabled={saving || isLoadingWorkspace}
            className="h-11 bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#0B0F1A] font-semibold hover:opacity-90 px-6 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving changes..." : "Save Workspace Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
