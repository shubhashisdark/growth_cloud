"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Lock } from "lucide-react";
import { AuthPageShell } from "@/components/auth-page-shell";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { parseFrontendError } from "@/lib/backend";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const { resetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long");
      return;
    }

    if (!token) {
      setMessage("Invalid or missing reset token. Please request a new password reset link.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await resetPassword({ token, password });
      setSuccess(true);
      setMessage("Password reset successfully! You can now log in with your new password.");
    } catch (err) {
      setMessage(parseFrontendError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell
      variant="login"
      title="Set New Password"
      subtitle="Enter your new password to regain access to your Growth Cloud workspace."
      footerLabel="Remember your password?"
      footerHref="/login"
      footerLinkLabel="Back to login"
      statusTone={success ? "success" : message ? "error" : "info"}
      statusMessage={message}
    >
      {success ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-[#F1F5F9]">Password Updated</h3>
            <p className="text-sm text-[#94A3B8] mt-1">Your password has been changed successfully.</p>
          </div>
          <Link href="/login" className="inline-block w-full">
            <Button className="w-full h-11 bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#0B0F1A] font-semibold hover:opacity-90">
              Sign In Now
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#E2E8F0]">New password</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              required
              minLength={8}
              className="h-11 rounded-xl border-white/8 bg-[#070A14] text-[#F1F5F9] placeholder:text-[#64748B]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#E2E8F0]">Confirm new password</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Re-enter new password"
              required
              minLength={8}
              className="h-11 rounded-xl border-white/8 bg-[#070A14] text-[#F1F5F9] placeholder:text-[#64748B]"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#0B0F1A] font-semibold hover:opacity-90"
          >
            {loading ? "Updating password..." : "Reset password"}
          </Button>
        </form>
      )}
    </AuthPageShell>
  );
}
