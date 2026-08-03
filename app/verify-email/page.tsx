"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, Mail, Loader2 } from "lucide-react";
import { AuthPageShell } from "@/components/auth-page-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { parseFrontendError } from "@/lib/backend";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const isSent = searchParams.get("sent") === "1";

  const { verifyEmail, resendVerification } = useAuth();
  const [verifying, setVerifying] = useState(!!token);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;

    let active = true;
    async function runVerify() {
      try {
        await verifyEmail(token);
        if (active) {
          setSuccess(true);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(parseFrontendError(err));
          setSuccess(false);
        }
      } finally {
        if (active) setVerifying(false);
      }
    }

    void runVerify();
    return () => {
      active = false;
    };
  }, [token, verifyEmail]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail || resending) return;

    setResending(true);
    setResendMessage(null);
    try {
      const res = await resendVerification(resendEmail);
      setResendMessage(res.data.message || "Verification link sent! Check your inbox.");
    } catch (err) {
      setResendMessage(parseFrontendError(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthPageShell
      variant="login"
      title="Email Verification"
      subtitle="Verify your work email address to activate all platform features."
      footerLabel="Return to"
      footerHref="/login"
      footerLinkLabel="Sign in"
      statusTone={success ? "success" : error ? "error" : "info"}
      statusMessage={
        verifying
          ? "Verifying token..."
          : success
          ? "Your email has been verified successfully!"
          : error
          ? error
          : isSent
          ? "Verification email sent! Please check your inbox and click the verification link."
          : null
      }
    >
      {verifying && (
        <div className="flex flex-col items-center justify-center py-8 text-center text-[#94A3B8]">
          <Loader2 className="w-8 h-8 animate-spin text-[#38BDF8] mb-3" />
          <p className="text-sm">Verifying your token with Growth Cloud...</p>
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-[#F1F5F9]">Email Verified</h3>
            <p className="text-sm text-[#94A3B8] mt-1">Your account is fully active and verified.</p>
          </div>
          <Link href="/dashboard" className="inline-block w-full">
            <Button className="w-full h-11 bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#0B0F1A] font-semibold hover:opacity-90">
              Continue to Dashboard
            </Button>
          </Link>
        </div>
      )}

      {(!verifying && !success) && (
        <form onSubmit={handleResend} className="space-y-4">
          <div className="rounded-2xl border border-white/8 bg-[#070A14] p-4 text-sm text-[#94A3B8] space-y-2">
            <div className="flex items-center gap-2 text-[#F1F5F9] font-medium">
              <Mail className="w-4 h-4 text-[#38BDF8]" />
              <span>Need a new verification link?</span>
            </div>
            <p className="text-xs">Enter your work email below to receive a new verification link.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#E2E8F0]">Work email</label>
            <Input
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              type="email"
              placeholder="sarah@company.com"
              required
              className="h-11 rounded-xl border-white/8 bg-[#070A14] text-[#F1F5F9] placeholder:text-[#64748B]"
            />
          </div>

          <Button
            type="submit"
            disabled={resending}
            className="w-full h-11 bg-[#1E2538] text-[#F1F5F9] hover:bg-[#2B354F] border border-white/8"
          >
            {resending ? "Sending link..." : "Resend verification email"}
          </Button>

          {resendMessage && (
            <p className="text-xs text-center text-[#38BDF8] mt-2">{resendMessage}</p>
          )}
        </form>
      )}
    </AuthPageShell>
  );
}
