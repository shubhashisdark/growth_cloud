"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  XCircle,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Clock,
} from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceMember } from "@/lib/backend";

const roleColors: Record<string, string> = {
  super_admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  admin: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  marketer: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  developer: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  sales: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  viewer: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function TeamSettingsPage() {
  const { user } = useAuth();
  const {
    workspace,
    members,
    invitations,
    isLoadingMembers,
    isLoadingInvitations,
    sendInvitation,
    removeMember,
    updateMemberRole,
    revokeInvitation,
  } = useWorkspace();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceMember["role"]>("marketer");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || sendingInvite) return;

    setSendingInvite(true);
    setFeedback(null);
    try {
      await sendInvitation({ email: inviteEmail, role: inviteRole });
      setFeedback({ type: "success", message: `Invitation sent to ${inviteEmail}` });
      setInviteEmail("");
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to send invitation",
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) return;

    try {
      await removeMember(userId);
      setFeedback({ type: "success", message: `Removed ${memberName} from workspace` });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to remove member",
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: WorkspaceMember["role"]) => {
    try {
      await updateMemberRole({ userId, role: newRole });
      setFeedback({ type: "success", message: "Member role updated" });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update role",
      });
    }
  };

  const handleRevokeInvite = async (invitationId: string, email: string) => {
    try {
      await revokeInvitation(invitationId);
      setFeedback({ type: "success", message: `Invitation for ${email} revoked` });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to revoke invitation",
      });
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#F1F5F9] transition-colors mb-3"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Settings</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9]">Team & RBAC Management</h1>
            <p className="text-sm text-[#94A3B8] mt-1">
              Manage workspace members, assign roles, and invite team members.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[#CBD5E1]">
              Workspace: <strong className="text-[#38BDF8]">{workspace?.name || "Loading..."}</strong>
            </span>
          </div>
        </div>
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

      {/* Invite Team Member Card */}
      <div className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-6 space-y-4">
        <div className="flex items-center gap-2 text-[#F1F5F9] font-semibold text-lg">
          <UserPlus className="w-5 h-5 text-[#38BDF8]" />
          <span>Invite New Member</span>
        </div>
        <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
              className="h-11 bg-[#070A14] border-white/8 text-[#F1F5F9]"
            />
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as WorkspaceMember["role"])}
            className="h-11 px-4 rounded-xl border border-white/8 bg-[#070A14] text-[#F1F5F9] text-sm focus:outline-none focus:border-[#38BDF8]"
          >
            <option value="admin">Admin</option>
            <option value="marketer">Marketer</option>
            <option value="developer">Developer</option>
            <option value="sales">Sales</option>
            <option value="viewer">Viewer</option>
          </select>
          <Button
            type="submit"
            disabled={sendingInvite}
            className="h-11 bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#0B0F1A] font-semibold hover:opacity-90 px-6 shrink-0"
          >
            {sendingInvite ? "Sending..." : "Send Invite"}
          </Button>
        </form>
      </div>

      {/* Members List */}
      <div className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/8 pb-4">
          <div className="flex items-center gap-2 text-[#F1F5F9] font-semibold text-lg">
            <Users className="w-5 h-5 text-[#38BDF8]" />
            <span>Workspace Members ({members.length})</span>
          </div>
        </div>

        {isLoadingMembers ? (
          <div className="flex items-center justify-center py-8 text-[#94A3B8]">
            <Loader2 className="w-6 h-6 animate-spin text-[#38BDF8] mr-2" />
            Loading members...
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {members.map((member) => (
              <div key={member.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#38BDF8]/20 to-[#818CF8]/20 border border-white/10 flex items-center justify-center font-bold text-sm text-[#38BDF8]">
                    {member.name ? member.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#F1F5F9] flex items-center gap-2">
                      {member.name}
                      {member.userId === user?.id && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[#94A3B8]">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#94A3B8]">{member.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={member.role}
                    disabled={workspace?.ownerId === member.userId}
                    onChange={(e) =>
                      handleRoleChange(member.userId, e.target.value as WorkspaceMember["role"])
                    }
                    className={`text-xs px-2.5 py-1 rounded-lg border focus:outline-none bg-[#070A14] ${
                      roleColors[member.role] || "text-[#94A3B8]"
                    }`}
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="marketer">Marketer</option>
                    <option value="developer">Developer</option>
                    <option value="sales">Sales</option>
                    <option value="viewer">Viewer</option>
                  </select>

                  {workspace?.ownerId !== member.userId && member.userId !== user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.userId, member.name)}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/8 pb-4">
            <div className="flex items-center gap-2 text-[#F1F5F9] font-semibold text-lg">
              <Mail className="w-5 h-5 text-[#818CF8]" />
              <span>Pending Invitations ({invitations.length})</span>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {invitations.map((inv) => (
              <div key={inv.id} className="py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-[#F1F5F9] font-medium">{inv.email}</span>
                    <span className="text-xs text-[#94A3B8] ml-2">Role: {inv.role}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevokeInvite(inv.id, inv.email)}
                  className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                >
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
