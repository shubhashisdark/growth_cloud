"use client";

import Link from "next/link";
import {
  ChevronLeft,
  Mail,
  Shield,
  Building2,
  KeyRound,
  BadgeCheck,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";

function formatRole(role?: string) {
  if (!role) return "Member";
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function ProfilePage() {
  const { user, isLoading, activeWorkspace } = useAuth();
  const { workspace } = useWorkspace();

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const memberships = user?.memberships ?? [];
  const emailVerifiedAt = user?.emailVerifiedAt;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#F1F5F9] transition-colors mb-3"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Settings</span>
        </Link>
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Your Profile</h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Account details for the signed-in user and workspace access.
        </p>
      </div>

      {isLoading && !user ? (
        <div className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-8 text-sm text-[#94A3B8]">
          Loading profile…
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
                style={{
                  background: "linear-gradient(135deg, #38BDF8, #818CF8)",
                  color: "#0B0F1A",
                }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-[#F1F5F9] truncate">
                    {user?.name || "Signed out"}
                  </h2>
                  {emailVerifiedAt ? (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <BadgeCheck className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      Unverified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-[#94A3B8]">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{user?.email || "—"}</span>
                </div>
                <div className="text-xs text-[#64748B]">
                  Status: <span className="text-[#CBD5E1]">{user?.status || "active"}</span>
                  {user?.id ? (
                    <>
                      {" · "}
                      ID: <code className="text-[#38BDF8]">{user.id}</code>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#F1F5F9]">
                <Building2 className="w-4 h-4 text-[#38BDF8]" />
                Active workspace
              </div>
              <div>
                <div className="text-base font-medium text-[#F1F5F9]">
                  {workspace?.name || memberships[0]?.workspaceName || "No workspace"}
                </div>
                <div className="text-xs text-[#64748B] mt-1">
                  {activeWorkspace?.workspaceId || memberships[0]?.workspaceId || "—"}
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-white/8 bg-white/5 text-[#CBD5E1]">
                <Shield className="w-3 h-3 text-[#38BDF8]" />
                {formatRole(activeWorkspace?.role || memberships[0]?.role)}
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#F1F5F9]">
                <UserRound className="w-4 h-4 text-[#38BDF8]" />
                Account actions
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Change your password or manage team access for this workspace.
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/forgot-password">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-10 border-white/8 bg-transparent text-[#E2E8F0] hover:bg-[#1E2538] hover:text-[#F1F5F9]"
                  >
                    <KeyRound className="w-4 h-4 mr-2" />
                    Change password
                  </Button>
                </Link>
                <Link href="/settings/team">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-10 border-white/8 bg-transparent text-[#E2E8F0] hover:bg-[#1E2538] hover:text-[#F1F5F9]"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Team & roles
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {memberships.length > 0 ? (
            <div className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-5 space-y-3">
              <div className="text-sm font-semibold text-[#F1F5F9]">Workspace memberships</div>
              <div className="divide-y divide-white/[0.06]">
                {memberships.map((membership) => (
                  <div
                    key={`${membership.workspaceId}-${membership.role}`}
                    className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-[#F1F5F9] truncate">
                        {membership.workspaceName || membership.workspaceId}
                      </div>
                      <div className="text-[11px] text-[#64748B] truncate">{membership.workspaceId}</div>
                    </div>
                    <span className="shrink-0 text-xs px-2.5 py-1 rounded-full border border-white/8 bg-white/5 text-[#CBD5E1]">
                      {formatRole(membership.role)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
