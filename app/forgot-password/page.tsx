"use client";

import React from "react";

import { AuthPageShell } from "@/components/auth-page-shell";
import { Input } from "@/components/ui/input";
import { forgotPassword, parseFrontendError } from "@/lib/backend";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage(null);

    try {
      await forgotPassword({ email });
      setMessage("Reset request sent. Check your email.");
    } catch (error) {
      setMessage(parseFrontendError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell
      variant="forgot-password"
      title="Recover access to your Growth Cloud workspace"
      subtitle="Reset your account so you can return to onboarding, integrations, lead capture, and the rest of the product flow."
      onSubmit={handleSubmit}
      submitLabel={loading ? "Sending reset request..." : "Send reset link"}
      submitDisabled={loading}
      footerLabel="Remember your password?"
      footerHref="/login"
      footerLinkLabel="Return to sign in"
      statusTone={message?.toLowerCase().includes("sent") || message?.toLowerCase().includes("reset token") ? "success" : message ? "error" : "info"}
      statusMessage={message}
    >
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#E2E8F0]">Work email</label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@company.com" required className="h-11 rounded-xl border-white/8 bg-deep text-[#F1F5F9] placeholder:text-[#64748B]" />
      </div>
    </AuthPageShell>
  );
}