"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, LockKeyhole, ShieldCheck, Zap } from "lucide-react";

import { AuthPageShell } from "@/components/auth-page-shell";
import { Input } from "@/components/ui/input";
import { login, parseFrontendError } from "@/lib/backend";
import { toAuthSession } from "@/lib/stores/auth-session";
import { useAuthSessionStore } from "@/lib/stores/auth-session";

const trustPoints = [
  "Continue from onboarding into dashboards, leads, campaigns, and analytics",
  "Secure workspace access with role-aware authentication flows",
  "Built for company teams, not a consumer-style login screen",
];

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthSessionStore((state) => state.setSession);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await login({ email, password });
      setSession(toAuthSession(response.data));
      setMessage("Login successful. Redirecting to dashboard...");
      router.replace("/dashboard");
    } catch (error) {
      setMessage(parseFrontendError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell
      variant="login"
      title="Sign in to Codemate Growth Cloud"
      subtitle="Access your company workspace, continue the onboarding flow, and keep your growth operations running from one secure place."
      onSubmit={handleSubmit}
      submitLabel={loading ? "Signing in..." : "Sign in"}
      submitDisabled={loading}
      footerLabel="New company account?"
      footerHref="/signup"
      footerLinkLabel="Start onboarding"
      statusTone={message?.toLowerCase().includes("successful") ? "success" : message ? "error" : "info"}
      statusMessage={message}
    >
      <div className="rounded-2xl border border-white/8 bg-[#070A14] p-4 text-sm text-[#CBD5E1]">
        <div className="flex items-center gap-2 text-[#F1F5F9]">
          <LockKeyhole className="h-4 w-4 text-[#38BDF8]" />
          Secure company access
        </div>
        <p className="mt-2 leading-6 text-[#94A3B8]">
          Sign in with your work email to resume the customer journey, manage leads, and review campaign performance.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#E2E8F0]">Work email</label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          className="h-11 rounded-xl border-white/8 bg-[#070A14] text-[#F1F5F9] placeholder:text-[#64748B]"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#E2E8F0]">Password</label>
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          className="h-11 rounded-xl border-white/8 bg-[#070A14] text-[#F1F5F9] placeholder:text-[#64748B]"
        />
      </div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2 text-[#94A3B8]">
          <ShieldCheck className="h-4 w-4 text-success" />
          Workspace access is protected
        </div>
        <Link href="/forgot-password" className="font-medium text-[#38BDF8] hover:text-[#7DD3FC]">
          Forgot password?
        </Link>
      </div>

      <div className="rounded-2xl border border-white/8 bg-surface p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#F1F5F9]">
          <Zap className="h-4 w-4 text-[#38BDF8]" />
          What happens after sign in
        </div>
        <div className="mt-3 space-y-2 text-sm text-[#94A3B8]">
          {trustPoints.map((point) => (
            <div key={point} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>{point}</span>
            </div>
          ))}
        </div>
      </div>
    </AuthPageShell>
  );
}