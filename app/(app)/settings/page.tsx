"use client";

import Link from "next/link";
import { Building2, Users, Key, BarChart2, UserRound, ChevronRight } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const { user } = useAuth();
  const { workspace, members } = useWorkspace();

  const settingsCards = [
    {
      title: "Your Profile",
      description: "View your account details, role, email verification status, and workspace memberships.",
      icon: UserRound,
      href: "/settings/profile",
      tag: user?.name || "Account",
      color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    },
    {
      title: "Workspace Preferences",
      description: "Manage workspace name, slug, timezone, and plan options.",
      icon: Building2,
      href: "/settings/workspace",
      tag: workspace?.name || "Workspace",
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Team & Access Control (RBAC)",
      description: "Invite team members, assign roles (Admin, Marketer, Dev, Sales, Viewer), and manage access.",
      icon: Users,
      href: "/settings/team",
      tag: `${members.length} member${members.length === 1 ? "" : "s"}`,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "API Key Management",
      description: "Create, rotate, and revoke public SDK keys and secret API keys with custom permission scopes.",
      icon: Key,
      href: "/dashboard/api-keys",
      tag: "Keys & Tokens",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "API Telemetry & Usage",
      description: "Monitor request volume, status codes, latency, and endpoint activity for your API keys.",
      icon: BarChart2,
      href: "/dashboard/api-keys/usage",
      tag: "Metrics",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Workspace Settings</h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Configure authentication, team permissions, workspace branding, and API key security.
        </p>
      </div>

      {/* User & Workspace Banner */}
      <div className="rounded-2xl border border-white/8 bg-[#0B0F1A] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#38BDF8] to-[#818CF8] flex items-center justify-center font-bold text-lg text-[#0B0F1A]">
            {user?.name ? user.name.charAt(0).toUpperCase() : "G"}
          </div>
          <div>
            <div className="text-base font-semibold text-[#F1F5F9] flex items-center gap-2">
              {workspace?.name || "Growth Cloud Workspace"}
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-normal">
                {workspace?.plan || "Active Plan"}
              </span>
            </div>
            <div className="text-xs text-[#94A3B8] mt-0.5">
              Logged in as <strong className="text-[#CBD5E1]">{user?.email}</strong>
            </div>
          </div>
        </div>

        <div className="text-xs text-[#64748B] sm:text-right">
          <div>Workspace ID: <code className="text-[#38BDF8]">{workspace?.id || "..."}</code></div>
          <div>Timezone: {workspace?.timezone || "UTC"}</div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-2xl border border-white/8 bg-[#0B0F1A] p-6 transition-all duration-200 hover:border-white/20 hover:bg-[#0E1526] flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full border border-white/8 bg-white/5 text-[#94A3B8]">
                    {card.tag}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#F1F5F9] group-hover:text-[#38BDF8] transition-colors flex items-center gap-1.5">
                    <span>{card.title}</span>
                    <ChevronRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#38BDF8]" />
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
