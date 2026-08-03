"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, PlugZap } from "lucide-react";

import { IntegrationsTabs } from "@/components/integrations-tabs";
import { Button } from "@/components/ui/button";
import { useAuthSessionStore } from "@/lib/stores/auth-session";

function PageHeader() {
  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(56,189,248,0.2)] bg-[rgba(56,189,248,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#38BDF8]">
        Live integrations
      </div>
      <h1 className="mt-4 text-[28px] font-bold tracking-[-0.02em] text-[#F1F5F9]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
        Integrations
      </h1>
      <p className="mt-1.5 max-w-3xl text-[15px] text-[#94A3B8]">
        Connect your website, backend, and team access with live backend data instead of placeholder mock content.
      </p>
    </motion.div>
  );
}

function EmptyWorkspaceState() {
  const session = useAuthSessionStore((state) => state.session);
  const workspaceMembership = session?.user?.memberships?.[0] ?? null;

  if (workspaceMembership) return null;

  return (
    <motion.section
      className="rounded-3xl border border-white/8 bg-[#111827] p-6 md:p-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(56,189,248,0.2)] bg-[rgba(56,189,248,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#38BDF8]">
            <PlugZap className="h-3.5 w-3.5" />
            Workspace required
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-[-0.03em] text-[#F1F5F9]">
            Create or join a workspace to unlock integrations
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
            The integrations area is ready, but there is no active workspace on this session yet. Start by creating a workspace or asking an owner to add you so the backend can load API keys, members, and source setup.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="h-11 rounded-xl bg-sky-500 px-5 text-sm font-medium text-white hover:bg-sky-400">
            <Link href="/signup">
              <Plus className="mr-2 h-4 w-4" />
              Create workspace
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-xl border-white/10 bg-transparent px-5 text-sm font-medium text-[#E2E8F0] hover:bg-white/5">
            <Link href="/dashboard">
              Go to dashboard
            </Link>
          </Button>
        </div>
      </div>
    </motion.section>
  );
}

export default function IntegrationsPage() {
  return (
    <main className="min-h-screen bg-[#070A14] text-[#F1F5F9]">
      <div className="min-h-screen px-6 py-8 md:px-10 lg:px-12">
        <div className="mx-auto max-w-[1200px]">
          <PageHeader />
          <div className="space-y-6">
            <EmptyWorkspaceState />
            <IntegrationsTabs />
          </div>
        </div>
      </div>
    </main>
  );
}
