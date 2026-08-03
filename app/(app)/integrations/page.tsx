"use client";

import React from "react";
import Link from "next/link";
import { PlugZap, Plus } from "lucide-react";

import { IntegrationsTabs } from "@/components/integrations-tabs";
import { Button } from "@/components/ui/button";
import { useAuthSessionStore } from "@/lib/stores/auth-session";

export default function IntegrationsPage() {
  const session = useAuthSessionStore((state) => state.session);
  const workspaceMembership = session?.user?.memberships?.[0] ?? null;

  return (
    <main className="min-h-screen bg-[#070A14] text-[#F1F5F9]">
      <div className="px-6 py-8 md:px-10 lg:px-12">
        <div className="mx-auto max-w-[1100px] space-y-6">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#38BDF8]">Integrations</p>
            <h1 className="mt-2 text-[28px] font-bold tracking-[-0.02em] text-[#F1F5F9]">
              Connect SDK, team, and webhooks
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] text-[#94A3B8]">
              Create public/secret keys, install{" "}
              <a
                href="https://www.npmjs.com/package/@shubhashis9556/growthcloud-sdk"
                target="_blank"
                rel="noreferrer"
                className="text-[#38BDF8] hover:underline"
              >
                @shubhashis9556/growthcloud-sdk
              </a>
              , invite teammates, and manage webhooks.
            </p>
          </header>

          {!workspaceMembership ? (
            <section className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 text-[#38BDF8]">
                    <PlugZap className="h-4 w-4" />
                    <span className="text-sm font-medium">Workspace required</span>
                  </div>
                  <p className="mt-2 text-sm text-[#94A3B8]">
                    Sign in with a workspace membership to manage integrations.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild className="h-10 rounded-lg bg-[#38BDF8] text-[#0B0F1A] hover:bg-[#38BDF8]/90">
                    <Link href="/signup">
                      <Plus className="mr-2 h-4 w-4" />
                      Create workspace
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-10 rounded-lg border-white/[0.08] bg-transparent text-[#F1F5F9]">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                </div>
              </div>
            </section>
          ) : (
            <IntegrationsTabs />
          )}
        </div>
      </div>
    </main>
  );
}
