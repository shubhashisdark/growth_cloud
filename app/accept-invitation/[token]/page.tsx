"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, UserPlus } from "lucide-react";
import { AuthPageShell } from "@/components/auth-page-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { parseFrontendError } from "@/lib/backend";

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = (params.token as string) || "";

  const { acceptInvitation } = useAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!token) {
      setMessage("Invalid or missing invitation token");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await acceptInvitation({ token, name, password });
      setSuccess(true);
      setMessage("Invitation accepted! You are now a member of the workspace.");
    } catch (err) {
      setMessage(parseFrontendError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell
      variant="signup"
      title="Join Your Team on Growth Cloud"
      subtitle="Accept your team invitation to access shared leads, workflows, and analytics."
      footerLabel="Already registered?"
      footerHref="/login"
      footerLinkLabel="Sign in"
      statusTone={success ? "success" : message ? "error" : "info"}
      statusMessage={message}
    >
      {success ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-[#F1F5F9]">Welcome to the Team!</h3>
            <p className="text-sm text-[#94A3B8] mt-1">Your account has been added to the workspace.</p>
          </div>
          <Link href="/login" className="inline-block w-full">
            <Button className="w-full h-11 bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#0B0F1A] font-semibold hover:opacity-90">
              Sign In to Workspace
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#E2E8F0]">Your full name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="Alex Morgan"
              required
              className="h-11 rounded-xl border-white/8 bg-[#070A14] text-[#F1F5F9] placeholder:text-[#64748B]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#E2E8F0]">Choose password</label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="At least 8 characters"
              required
              minLength={8}
              className="h-11 rounded-xl border-white/8 bg-[#070A14] text-[#F1F5F9] placeholder:text-[#64748B]"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-[#0B0F1A] font-semibold hover:opacity-90 flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? "Joining workspace..." : "Accept Invitation & Join"}
          </Button>
        </form>
      )}
    </AuthPageShell>
  );
}
