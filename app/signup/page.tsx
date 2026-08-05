"use client";

import React from "react";
import { useRouter } from "next/navigation";

import { AuthPageShell } from "@/components/auth-page-shell";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { signup, parseFrontendError } from "@/lib/backend";

const checklist = [
  "Create the company workspace and starter access",
  "Prepare the account for integrations, data capture, and automation",
  "Move from signup into the full onboarding experience",
];

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [workspaceName, setWorkspaceName] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage(null);

    try {
      await signup({ name, email, password, workspaceName });
      setMessage("Signup successful! Redirecting to email verification...");
      router.push("/verify-email?sent=1");
    } catch (error) {
      setMessage(parseFrontendError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell
      variant="signup"
      title="Create your Codemate Growth Cloud workspace"
      subtitle="Set up the company account, create the workspace, and get ready to connect sources, teams, and automation flows."
      onSubmit={handleSubmit}
      submitLabel={loading ? "Creating account..." : "Create account"}
      submitDisabled={loading}
      footerLabel="Already started onboarding?"
      footerHref="/login"
      footerLinkLabel="Continue sign in"
      statusTone={message?.toLowerCase().includes("successful") ? "success" : message ? "error" : "info"}
      statusMessage={message}
    >
      <div className="rounded-2xl border border-white/8 bg-[#070A14] p-4 text-sm text-[#CBD5E1]">
        <div className="text-sm font-semibold text-[#F1F5F9]">Company setup overview</div>
        <div className="mt-2 space-y-2 text-[#94A3B8]">
          {checklist.map((item) => (
            <div key={item} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#E2E8F0]">Full name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
          autoComplete="name"
          placeholder="Sarah Kim"
          required
          className="h-11 rounded-xl border-white/8 bg-[#070A14] text-[#F1F5F9] placeholder:text-[#64748B]"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#E2E8F0]">Work email</label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          placeholder="sarah@company.com"
          required
          className="h-11 rounded-xl border-white/8 bg-[#070A14] text-[#F1F5F9] placeholder:text-[#64748B]"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#E2E8F0]">Password</label>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
          className="h-11 rounded-xl border-white/8 bg-[#070A14] text-[#F1F5F9] placeholder:text-[#64748B]"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#E2E8F0]">Workspace name</label>
        <Input
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          type="text"
          autoComplete="organization"
          placeholder="Acme Marketing"
          required
          className="h-11 rounded-xl border-white/8 bg-[#070A14] text-[#F1F5F9] placeholder:text-[#64748B]"
        />
      </div>
    </AuthPageShell>
  );
}