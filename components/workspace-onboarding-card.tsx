"use client";

import React from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import { useAuthSessionStore } from "@/lib/stores/auth-session";

const steps = [
  { title: "Create workspace", description: "Your company workspace is already created during signup." },
  { title: "Connect sources", description: "Add website, backend, or webhook integrations to start collecting events." },
  { title: "Capture leads", description: "Use API keys and forms to store leads and trigger workflows." },
  { title: "Launch campaigns", description: "Create campaigns, segments, and automation flows from the dashboard." },
];

export function WorkspaceOnboardingCard() {
  const session = useAuthSessionStore((state) => state.session);
  const workspaceName = session?.user?.memberships?.[0]?.workspaceId ?? "your workspace";

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#38BDF8]">
            <Sparkles className="h-4 w-4" />
            Onboarding path
          </div>
          <h3 className="mt-2 text-xl font-semibold text-[#F1F5F9]">Welcome to CodeMate Growth Cloud</h3>
          <p className="mt-2 text-sm text-[#94A3B8]">
            {session?.user?.name ?? "Your team"} is now inside {workspaceName}. Continue with the core flow: connect sources, capture leads, and launch automation.
          </p>
        </div>
        <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          Live workspace
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {steps.map((step, index) => (
          <div key={step.title} className="rounded-xl border border-white/[0.08] bg-[#0F172A] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#E2E8F0]">
              <CheckCircle2 className="h-4 w-4 text-[#38BDF8]" />
              {step.title}
            </div>
            <p className="mt-2 text-sm text-[#94A3B8]">{step.description}</p>
            <div className="mt-3 text-xs uppercase tracking-[0.08em] text-[#64748B]">Step {index + 1}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
        <span>Next recommended action</span>
        <span className="font-semibold">Create your first integration or API key</span>
        <ArrowRight className="h-4 w-4" />
      </div>
    </div>
  );
}
