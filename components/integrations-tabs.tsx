"use client";

import React from "react";
import { Building2, KeyRound, Plug, RefreshCw, Users2, ShieldCheck } from "lucide-react";

import { WebhooksManager } from "./webhooks-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createApiKey,
  createWorkspaceMember,
  getApiKeys,
  getWorkspaceMembers,
  getWorkspaces,
  type ApiKeySummary,
  type Workspace,
  type WorkspaceMember,
} from "@/lib/backend";
import { cn } from "@/lib/utils";

const PUBLIC_SCOPES = ["events:write", "identify:write"];
const SECRET_SCOPES = ["events:write", "identify:write", "leads:read", "leads:write", "workflows:read"];

const INSTALL_METHODS = [
  { id: "script", label: "Script Tag", description: "Drop the SDK into your website header." },
  { id: "npm", label: "npm Package", description: "Install the SDK in your frontend build." },
  { id: "wordpress", label: "WordPress", description: "Add the SDK with a plugin or theme." },
] as const;

function maskKey(value: string) {
  if (value.length <= 12) return value;
  return `${value.slice(0, 10)}${"x".repeat(Math.max(0, value.length - 10))}`;
}

function groupApiKeys(apiKeys: ApiKeySummary[]) {
  const publicKey = apiKeys.find((key) => key.type === "public" && key.status === "active") ?? null;
  const secretKeys = apiKeys.filter((key) => key.type === "secret");
  return { publicKey, secretKeys };
}

function StepPill({ step, active, completed }: { step: number; active?: boolean; completed?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
        completed
          ? "border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.10)] text-success"
          : active
            ? "border-[rgba(56,189,248,0.2)] bg-[rgba(56,189,248,0.10)] text-[#38BDF8]"
            : "border-white/8 bg-deep text-[#64748B]"
      )}
    >
      {step}
    </div>
  );
}

export function IntegrationsTabs() {
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [apiKeys, setApiKeys] = React.useState<ApiKeySummary[]>([]);
  const [members, setMembers] = React.useState<WorkspaceMember[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [installMethod, setInstallMethod] = React.useState<(typeof INSTALL_METHODS)[number]["id"]>("script");
  const [domainInput, setDomainInput] = React.useState("");
  const [allowedDomains, setAllowedDomains] = React.useState<string[]>([]);
  const [sdkVisible, setSdkVisible] = React.useState(false);
  const [copyStatus, setCopyStatus] = React.useState<string | null>(null);

  const [apiKeyName, setApiKeyName] = React.useState("Website SDK Key");
  const [apiKeyType, setApiKeyType] = React.useState<"public" | "secret">("public");
  const [apiKeyScopes, setApiKeyScopes] = React.useState<string>(PUBLIC_SCOPES.join(", "));
  const [apiKeySaving, setApiKeySaving] = React.useState(false);

  const [memberName, setMemberName] = React.useState("");
  const [memberEmail, setMemberEmail] = React.useState("");
  const [memberRole, setMemberRole] = React.useState<WorkspaceMember["role"]>("marketer");
  const [memberSaving, setMemberSaving] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [workspaceResponse, apiKeyResponse] = await Promise.all([getWorkspaces(), getApiKeys()]);
      const nextWorkspaces = workspaceResponse.data.workspaces;
      const nextApiKeys = apiKeyResponse.data.items;

      setWorkspaces(nextWorkspaces);
      setApiKeys(nextApiKeys);

      const nextWorkspaceId = selectedWorkspaceId || nextWorkspaces[0]?.id || "";
      setSelectedWorkspaceId(nextWorkspaceId);

      if (nextWorkspaceId) {
        const membersResponse = await getWorkspaceMembers(nextWorkspaceId);
        setMembers(membersResponse.data.items);
      } else {
        setMembers([]);
      }

      const { publicKey } = groupApiKeys(nextApiKeys);
      setAllowedDomains(publicKey ? ["localhost", "app.localhost"] : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load integration data");
    } finally {
      setLoading(false);
    }
  }, [selectedWorkspaceId]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  React.useEffect(() => {
    if (!selectedWorkspaceId) return;

    let active = true;

    async function loadMembers() {
      try {
        const response = await getWorkspaceMembers(selectedWorkspaceId);
        if (active) setMembers(response.data.items);
      } catch {
        if (active) setMembers([]);
      }
    }

    void loadMembers();

    return () => {
      active = false;
    };
  }, [selectedWorkspaceId]);

  const selectedWorkspace = workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null;
  const { publicKey, secretKeys } = groupApiKeys(apiKeys);
  const publicSdkKey = publicKey?.prefix ?? "cm_pub_••••••••";
  const secretKey = secretKeys[0]?.prefix ?? "cm_live_••••••••";

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus("Copied to clipboard");
      window.setTimeout(() => setCopyStatus(null), 1500);
    } catch {
      setCopyStatus("Copy failed");
    }
  };

  const handleAddDomain = () => {
    const nextDomain = domainInput.trim();
    if (!nextDomain) return;
    setAllowedDomains((current) => (current.includes(nextDomain) ? current : [...current, nextDomain]));
    setDomainInput("");
  };

  const handleRemoveDomain = (domain: string) => {
    setAllowedDomains((current) => current.filter((item) => item !== domain));
  };

  const handleCreateApiKey = async () => {
    if (!selectedWorkspaceId) return;
    setApiKeySaving(true);
    setError(null);

    try {
      const scopes = apiKeyScopes.split(",").map((scope) => scope.trim()).filter(Boolean);
      await createApiKey({ workspaceId: selectedWorkspaceId, name: apiKeyName, type: apiKeyType, scopes });
      const response = await getApiKeys(selectedWorkspaceId);
      setApiKeys(response.data.items);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to create API key");
    } finally {
      setApiKeySaving(false);
    }
  };

  const handleInviteMember = async () => {
    if (!selectedWorkspaceId) return;
    setMemberSaving(true);
    setError(null);

    try {
      await createWorkspaceMember({
        workspaceId: selectedWorkspaceId,
        name: memberName,
        email: memberEmail,
        role: memberRole,
      });
      const response = await getWorkspaceMembers(selectedWorkspaceId);
      setMembers(response.data.items);
      setMemberName("");
      setMemberEmail("");
      setMemberRole("marketer");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to invite member");
    } finally {
      setMemberSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/8 bg-[#111827] p-8 text-[#94A3B8]">
        Loading integration setup...
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="space-y-6">
        <div className="rounded-3xl border border-white/8 bg-[#111827] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(56,189,248,0.2)] bg-[rgba(56,189,248,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#38BDF8]">
                <Plug className="h-3.5 w-3.5" />
                Integration Setup
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-[-0.03em] text-[#F1F5F9]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
                Connect website, backend, and team access
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8]">
                This screen uses live backend data. It lists your workspaces, reads your API keys, invites team members, and keeps the SDK setup aligned with the selected workspace.
              </p>
            </div>
            <Button variant="outline" className="h-10 rounded-lg border-white/8 bg-transparent text-[#F1F5F9] hover:bg-white/5" onClick={() => void loadData()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-danger">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { title: "Company onboarding", description: "Workspace and access are read directly from the backend.", icon: Building2 },
              { title: "Key management", description: "Public and secret keys come from the API key service.", icon: KeyRound },
              { title: "Team setup", description: "Invite marketers, admins, developers, and sales users.", icon: Users2 },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="rounded-2xl border border-white/8 bg-deep p-4">
                  <Icon className="h-5 w-5 text-[#38BDF8]" />
                  <div className="mt-3 text-sm font-semibold text-[#F1F5F9]">{card.title}</div>
                  <div className="mt-1 text-[13px] leading-6 text-[#94A3B8]">{card.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-white/8 bg-[#111827] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[#F1F5F9]">Selected workspace</div>
              <div className="mt-1 text-sm text-[#94A3B8]">
                {selectedWorkspace ? `${selectedWorkspace.name} · ${selectedWorkspace.slug}` : "No workspace available yet"}
              </div>
            </div>
            <div className="min-w-[240px]">
              <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
                <SelectTrigger className="h-10 rounded-lg border-white/8 bg-deep text-[#F1F5F9]">
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent className="border-white/8 bg-[#111827] text-[#F1F5F9]">
                  {workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-deep p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#F1F5F9]">Website SDK</div>
                  <div className="mt-1 text-[13px] text-[#64748B]">Public key for frontend tracking</div>
                </div>
                <Badge className="border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.10)] text-success">Active</Badge>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-white/8 bg-[#070A14] px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-[#64748B]">Public SDK key</div>
                  <div className="mt-1 font-mono text-sm text-[#F1F5F9]">{sdkVisible ? publicSdkKey : maskKey(publicSdkKey)}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="h-9 rounded-lg border-white/8 bg-transparent text-[#F1F5F9] hover:bg-white/5" onClick={() => void handleCopy(publicSdkKey)}>
                    Copy key
                  </Button>
                  <Button variant="outline" className="h-9 rounded-lg border-white/8 bg-transparent text-[#F1F5F9] hover:bg-white/5" onClick={() => setSdkVisible((value) => !value)}>
                    {sdkVisible ? "Hide" : "Reveal"}
                  </Button>
                </div>

                <div>
                  <div className="text-[13px] font-semibold text-[#F1F5F9]">Allowed domains</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {allowedDomains.length > 0 ? allowedDomains.map((domain) => (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => handleRemoveDomain(domain)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-[#070A14] px-3 py-1.5 text-xs text-[#94A3B8] transition-colors hover:text-danger"
                      >
                        {domain}
                        <span aria-hidden>×</span>
                      </button>
                    )) : (
                      <div className="text-sm text-[#64748B]">No domains configured yet.</div>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={domainInput}
                      onChange={(event) => setDomainInput(event.target.value)}
                      placeholder="example.com"
                      className="h-9 rounded-lg border-white/8 bg-[#070A14] text-[#F1F5F9] placeholder:text-[#64748B]"
                    />
                    <Button variant="outline" className="h-9 rounded-lg border-white/8 bg-transparent text-[#F1F5F9] hover:bg-white/5" onClick={handleAddDomain}>
                      Add
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="text-[13px] font-semibold text-[#F1F5F9]">Installation method</div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {INSTALL_METHODS.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setInstallMethod(method.id)}
                        className={cn(
                          "rounded-2xl border p-4 text-left transition-colors",
                          installMethod === method.id
                            ? "border-[#38BDF8] bg-[rgba(56,189,248,0.06)]"
                            : "border-white/8 bg-[#070A14] hover:border-white/14"
                        )}
                      >
                        <div className="text-sm font-semibold text-[#F1F5F9]">{method.label}</div>
                        <div className="mt-1 text-[12px] text-[#64748B]">{method.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-deep p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#F1F5F9]">Backend API</div>
                  <div className="mt-1 text-[13px] text-[#64748B]">Secret API key for server-side use</div>
                </div>
                <Badge className="border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.10)] text-success">Connected</Badge>
              </div>

              <div className="mt-4 rounded-xl border border-white/8 bg-[#070A14] px-4 py-3">
                <div className="text-[10px] uppercase tracking-[0.12em] text-[#64748B]">Secret API key</div>
                <div className="mt-1 font-mono text-sm text-[#F1F5F9]">{maskKey(secretKey)}</div>
              </div>

              <div className="mt-4">
                <div className="text-[13px] font-semibold text-[#F1F5F9]">Connection checklist</div>
                <div className="mt-3 space-y-2 text-sm text-[#CBD5E1]">
                  {[
                    "Create workspace during signup",
                    "Select allowed domains for the SDK",
                    "Generate public and secret keys from the backend",
                    "Invite team members with workspace roles",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-xl border border-white/8 bg-[#070A14] px-3 py-2.5">
                      <ShieldCheck className="h-4 w-4 text-success" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-[#070A14] px-4 py-3 text-sm text-[#94A3B8]">
                <span>{copyStatus ?? "Copy a key to share it with your implementation team."}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/8 bg-[#111827] p-6">
          <WebhooksManager />
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-3xl border border-white/8 bg-[#111827] p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[#F1F5F9]">Create API key</div>
              <div className="mt-1 text-[13px] text-[#64748B]">Persisted in the backend and ready for production usage.</div>
            </div>
            <KeyRound className="h-5 w-5 text-[#38BDF8]" />
          </div>

          <div className="mt-4 space-y-4">
            <Input value={apiKeyName} onChange={(event) => setApiKeyName(event.target.value)} placeholder="Website SDK Key" className="h-10 rounded-lg border-white/8 bg-[#070A14] text-[#F1F5F9] placeholder:text-[#64748B]" />
            <Select
              value={apiKeyType}
              onValueChange={(value) => {
                const nextType = value as "public" | "secret";
                setApiKeyType(nextType);
                setApiKeyScopes(nextType === "public" ? PUBLIC_SCOPES.join(", ") : SECRET_SCOPES.join(", "));
              }}
            >
              <SelectTrigger className="h-10 rounded-lg border-white/8 bg-[#070A14] text-[#F1F5F9]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/8 bg-[#111827] text-[#F1F5F9]">
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="secret">Secret</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              value={apiKeyScopes}
              onChange={(event) => setApiKeyScopes(event.target.value)}
              placeholder="events:write, identify"
              className="min-h-[90px] rounded-lg border-white/8 bg-[#070A14] text-[#F1F5F9] placeholder:text-[#64748B]"
            />
            <Button className="h-10 w-full rounded-lg bg-[#38BDF8] text-[#0B0F1A] hover:bg-[#38BDF8]/90" onClick={handleCreateApiKey} disabled={!selectedWorkspaceId || apiKeySaving}>
              {apiKeySaving ? "Creating key..." : "Create key"}
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/8 bg-[#111827] p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[#F1F5F9]">Invite team</div>
              <div className="mt-1 text-[13px] text-[#64748B]">Assign roles before the team enters the dashboard.</div>
            </div>
            <Users2 className="h-5 w-5 text-[#38BDF8]" />
          </div>

          <div className="mt-4 space-y-4">
            <Input value={memberName} onChange={(event) => setMemberName(event.target.value)} placeholder="Alex Morgan" className="h-10 rounded-lg border-white/8 bg-[#070A14] text-[#F1F5F9] placeholder:text-[#64748B]" />
            <Input value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} placeholder="alex@company.com" className="h-10 rounded-lg border-white/8 bg-[#070A14] text-[#F1F5F9] placeholder:text-[#64748B]" />
            <Select value={memberRole} onValueChange={(value) => setMemberRole(value as WorkspaceMember["role"]) }>
              <SelectTrigger className="h-10 rounded-lg border-white/8 bg-[#070A14] text-[#F1F5F9]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/8 bg-[#111827] text-[#F1F5F9]">
                {[
                  "owner",
                  "admin",
                  "marketer",
                  "developer",
                  "sales",
                  "viewer",
                ].map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="h-10 w-full rounded-lg bg-[#38BDF8] text-[#0B0F1A] hover:bg-[#38BDF8]/90" onClick={handleInviteMember} disabled={!selectedWorkspaceId || memberSaving}>
              {memberSaving ? "Inviting..." : "Invite member"}
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/8 bg-[#111827] p-6">
          <div className="text-sm font-semibold text-[#F1F5F9]">Connected team</div>
          <div className="mt-4 space-y-3">
            {members.length > 0 ? members.map((member) => (
              <div key={member.id} className="rounded-xl border border-white/8 bg-[#070A14] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#F1F5F9]">{member.name}</div>
                    <div className="mt-1 text-[12px] font-mono text-[#64748B]">{member.email}</div>
                  </div>
                  <Badge className="border border-white/8 bg-[#1A1F2E] text-[#94A3B8]">{member.role}</Badge>
                </div>
              </div>
            )) : (
              <div className="rounded-xl border border-white/8 bg-[#070A14] px-4 py-3 text-sm text-[#64748B]">
                No members found for this workspace yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/8 bg-[#111827] p-6">
          <div className="text-sm font-semibold text-[#F1F5F9]">Implementation state</div>
          <div className="mt-4 space-y-4">
            <div className="flex items-start gap-3">
              <StepPill step={1} completed />
              <div>
                <div className="text-sm font-medium text-[#F1F5F9]">Workspace selection</div>
                <div className="text-[13px] text-[#64748B]">Loaded from backend workspaces.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepPill step={2} active />
              <div>
                <div className="text-sm font-medium text-[#F1F5F9]">API key generation</div>
                <div className="text-[13px] text-[#64748B]">Create public and secret keys from live data.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <StepPill step={3} />
              <div>
                <div className="text-sm font-medium text-[#F1F5F9]">Website and SDK setup</div>
                <div className="text-[13px] text-[#64748B]">Allowed domains and install method will be persisted next.</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}