"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, ArrowRight, Building2, Plug, Workflow, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuthVariant = "login" | "signup" | "forgot-password";

type AuthPageShellProps = {
  variant: AuthVariant;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  submitLabel?: string;
  submitDisabled?: boolean;
  footerLabel: string;
  footerHref: string;
  footerLinkLabel: string;
  statusTone?: "success" | "warning" | "info" | "error";
  statusMessage?: string | null;
};

function formatVariantLabel(variant: AuthVariant) {
  if (variant === "forgot-password") return "Forgot Password";
  return variant.charAt(0).toUpperCase() + variant.slice(1);
}

const flowCards = [
  {
    title: "Company Onboarding",
    description: "Signup, login, email recovery, workspace creation, and first-team setup.",
    icon: Building2,
  },
  {
    title: "Integration Setup",
    description: "Connect SDKs, API keys, webhooks, CSV import, and data sources.",
    icon: Plug,
  },
  {
    title: "Growth Operations",
    description: "Leads, scoring, segments, workflows, campaigns, analytics, and handoff.",
    icon: Workflow,
  },
];

export function AuthPageShell({
  variant,
  title,
  subtitle,
  children,
  onSubmit,
  submitLabel,
  submitDisabled = false,
  footerLabel,
  footerHref,
  footerLinkLabel,
  statusTone = "info",
  statusMessage,
}: AuthPageShellProps) {
  React.useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} · Codemate Growth Cloud`;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);

  return (
    <main className="min-h-screen bg-[#070A14] text-[#F1F5F9]">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.12),transparent_55%)]" />
        <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[1.1fr_0.9fr]">
          <section className="relative flex items-center px-6 py-12 sm:px-10 lg:px-12">
            <div className="absolute left-10 top-10 hidden h-24 w-24 rounded-full bg-[rgba(56,189,248,0.12)] blur-3xl lg:block" />
            <div className="absolute right-12 top-24 hidden h-32 w-32 rounded-full bg-[rgba(129,140,248,0.10)] blur-3xl lg:block" />

            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(56,189,248,0.2)] bg-[rgba(56,189,248,0.08)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#38BDF8]">
                <Sparkles className="h-3.5 w-3.5" />
                Codemate Growth Cloud
              </div>

              <motion.h1
                className="mt-6 text-4xl font-bold tracking-[-0.03em] sm:text-5xl"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
              >
                {title}
              </motion.h1>

              <motion.p
                className="mt-4 max-w-lg text-[15px] leading-7 text-[#94A3B8]"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08 }}
              >
                {subtitle}
              </motion.p>

              <div className="mt-8 space-y-3">
                <div className="rounded-2xl border border-white/8 bg-surface p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">Feature flow</div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {flowCards.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.title} className="rounded-xl border border-white/8 bg-deep p-4">
                          <Icon className="h-5 w-5 text-[#38BDF8]" />
                          <div className="mt-3 text-sm font-semibold text-[#F1F5F9]">{item.title}</div>
                          <div className="mt-1 text-[13px] leading-6 text-[#94A3B8]">{item.description}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-sm text-[#CBD5E1]">
                  {[
                    "Signup creates the workspace and the primary secret key",
                    "Login restores access to dashboard, leads, and analytics",
                    "Forgot password routes through the backend reset flow",
                    "Everything is ready for onboarding, integrations, and growth ops",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-xl border border-white/8 bg-surface p-4">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="flex items-center px-6 py-12 sm:px-10 lg:px-12">
            <motion.div
              className="w-full rounded-3xl border border-white/8 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">{formatVariantLabel(variant)}</div>
                  <div className="mt-1 text-xl font-semibold text-[#F1F5F9]">{title}</div>
                </div>
                <div className="rounded-full border border-white/8 bg-[#070A14] p-2 text-[#38BDF8]">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>

              {submitLabel ? (
                <form className="space-y-4" onSubmit={onSubmit ? onSubmit : (e) => e.preventDefault()}>
                  {children}

                  {statusMessage ? (
                    <div
                      role="status"
                      aria-live="polite"
                      className={cn(
                        "rounded-xl border px-4 py-3 text-sm",
                        statusTone === "success" && "border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.08)] text-success",
                        statusTone === "warning" && "border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.08)] text-[#FBBF24]",
                        statusTone === "error" && "border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] text-[#F87171]",
                        statusTone === "info" && "border-[rgba(56,189,248,0.2)] bg-[rgba(56,189,248,0.08)] text-[#38BDF8]"
                      )}
                    >
                      {statusMessage}
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    disabled={submitDisabled}
                    aria-busy={submitDisabled}
                    className="h-11 w-full rounded-xl bg-[#38BDF8] text-[#0B0F1A] hover:bg-[#38BDF8]/90 disabled:cursor-not-allowed disabled:opacity-70"
                    style={{ boxShadow: "0 0 24px rgba(56,189,248,0.18)" }}
                  >
                    {submitLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  {children}

                  {statusMessage ? (
                    <div
                      role="status"
                      aria-live="polite"
                      className={cn(
                        "rounded-xl border px-4 py-3 text-sm",
                        statusTone === "success" && "border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.08)] text-success",
                        statusTone === "warning" && "border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.08)] text-[#FBBF24]",
                        statusTone === "error" && "border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] text-[#F87171]",
                        statusTone === "info" && "border-[rgba(56,189,248,0.2)] bg-[rgba(56,189,248,0.08)] text-[#38BDF8]"
                      )}
                    >
                      {statusMessage}
                    </div>
                  ) : null}
                </div>
              )}

              <div className="mt-6 flex items-center justify-between gap-4 text-sm text-[#94A3B8]">
                <span>{footerLabel}</span>
                <Link href={footerHref} className="font-medium text-[#38BDF8] hover:text-[#7DD3FC]">
                  {footerLinkLabel}
                </Link>
              </div>
            </motion.div>
          </section>
        </div>
      </div>
    </main>
  );
}