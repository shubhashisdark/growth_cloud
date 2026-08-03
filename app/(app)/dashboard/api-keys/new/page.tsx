"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createApiKey } from "@/lib/backend";

const scopeOptions = [
  "auth:read",
  "workspaces:read",
  "workspaces:write",
  "users:write",
  "events:write",
  "identify:write",
  "api_keys:read",
  "api_keys:write",
  "api_usage:read",
];

export default function CreateApiKeyPage() {
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = React.useState("demo-workspace");
  const [name, setName] = React.useState("Website SDK key");
  const [type, setType] = React.useState<"public" | "secret">("public");
  const [selectedScopes, setSelectedScopes] = React.useState<string[]>(["events:write", "identify:write"]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [createdKey, setCreatedKey] = React.useState<Awaited<ReturnType<typeof createApiKey>>["data"] | null>(null);

  function toggleScope(scope: string) {
    setSelectedScopes((current) =>
      current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setCreatedKey(null);

    try {
      const result = await createApiKey({
        workspaceId,
        name,
        type,
        scopes: selectedScopes,
      });
      setCreatedKey(result.data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create API key");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen text-[#F1F5F9] p-8 md:p-12">
      <div className="mx-auto max-w-[1200px] space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.02em]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
              Create API Key
            </h1>
            <p className="mt-1.5 text-[15px] text-[#94A3B8]">
              Create workspace-scoped public or secret keys for SDK installation and backend integrations.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/api-keys" className="rounded-xl border border-white/[0.12] px-4 py-2 text-sm text-[#E2E8F0] transition hover:border-sky-400/40">
              Back to API keys
            </Link>
            <Link href="/dashboard/api-keys/usage" className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400">
              View usage
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        ) : null}

        {createdKey ? (
          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
            <h2 className="text-lg font-semibold text-emerald-200">API key created</h2>
            <div className="mt-4 space-y-2 text-sm text-emerald-100">
              <div><span className="text-emerald-200/80">Name:</span> {createdKey.apiKey.name}</div>
              <div><span className="text-emerald-200/80">Prefix:</span> {createdKey.apiKey.prefix}</div>
              <div><span className="text-emerald-200/80">Status:</span> {createdKey.apiKey.status}</div>
              <div><span className="text-emerald-200/80">Plaintext key:</span> {createdKey.plaintextKey}</div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard/api-keys")}
                className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-300"
              >
                Return to list
              </button>
              <button
                type="button"
                onClick={() => setCreatedKey(null)}
                className="rounded-xl border border-emerald-300/30 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/10"
              >
                Create another key
              </button>
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6 space-y-6">
            <div>
              <label className="text-sm font-medium text-[#CBD5E1]" htmlFor="workspaceId">
                Workspace ID
              </label>
              <input
                id="workspaceId"
                value={workspaceId}
                onChange={(event) => setWorkspaceId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#0B0F1A] px-4 py-3 text-sm text-[#F8FAFC] outline-none ring-0 placeholder:text-[#64748B] focus:border-sky-400/50"
                placeholder="demo-workspace"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#CBD5E1]" htmlFor="name">
                Key name
              </label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#0B0F1A] px-4 py-3 text-sm text-[#F8FAFC] outline-none ring-0 placeholder:text-[#64748B] focus:border-sky-400/50"
                placeholder="Website SDK key"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#CBD5E1]">Key type</label>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {(["public", "secret"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setType(option)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition ${type === option ? "border-sky-400/50 bg-sky-500/10 text-sky-200" : "border-white/[0.08] bg-[#0B0F1A] text-[#CBD5E1] hover:border-sky-400/30"}`}
                  >
                    <div className="font-medium capitalize">{option}</div>
                    <div className="mt-1 text-xs text-[#64748B]">
                      {option === "public" ? "Use for browser SDKs and allowed domains." : "Use for backend-to-backend API access."}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-[#CBD5E1]">Scopes</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {scopeOptions.map((scope) => {
                  const active = selectedScopes.includes(scope);
                  return (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => toggleScope(scope)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${active ? "border-sky-400/50 bg-sky-500/10 text-sky-200" : "border-white/[0.08] bg-white/[0.04] text-[#CBD5E1] hover:border-sky-400/30"}`}
                    >
                      {scope}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create API key"}
              </button>
              <Link href="/integrations" className="rounded-xl border border-white/[0.12] px-5 py-3 text-sm text-[#E2E8F0] transition hover:border-sky-400/40">
                Go to integrations
              </Link>
            </div>
          </form>

          <aside className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
            <h2 className="text-lg font-semibold">Recommended flow</h2>
            <div className="mt-4 space-y-3 text-sm text-[#94A3B8]">
              <p>1. Create a Public (SDK) key from the dashboard.</p>
              <p>2. Copy the plaintext key once and store it securely.</p>
              <p>
                3. Install{" "}
                <a
                  href="https://www.npmjs.com/package/@shubhashis9556/growthcloud-sdk"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#38BDF8] hover:underline"
                >
                  @shubhashis9556/growthcloud-sdk
                </a>{" "}
                then initialize with your public key.
              </p>
              <p>4. Monitor usage from the API usage view.</p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
