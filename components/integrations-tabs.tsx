"use client";

import React from "react";
import {
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  Mail,
  Plug,
  RefreshCw,
  Users2,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Terminal,
  ExternalLink,
} from "lucide-react";

import { WebhooksManager } from "./webhooks-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createApiKey,
  getApiKeys,
  getWorkspaceMembers,
  getWorkspaces,
  listInvitations,
  sendInvitation,
  type ApiKeySummary,
  type Workspace,
  type WorkspaceInvitation,
  type WorkspaceMember,
} from "@/lib/backend";
import { useAuthSessionStore } from "@/lib/stores/auth-session";
import { cn } from "@/lib/utils";

const PUBLIC_SCOPES = ["events:write", "identify:write"];
const SECRET_SCOPES = ["events:write", "identify:write", "api_keys:read", "workspaces:read"];
const ROLES: WorkspaceMember["role"][] = ["admin", "marketer", "developer", "sales", "viewer"];

type SectionId = "sdk" | "team" | "webhooks";
type InstallMethod = "script" | "npm";

function groupApiKeys(apiKeys: ApiKeySummary[]) {
  const publicKeys = apiKeys.filter((key) => key.type === "public" && key.status === "active");
  const secretKeys = apiKeys.filter((key) => key.type === "secret" && key.status === "active");
  return {
    publicKey: publicKeys[0] ?? null,
    secretKey: secretKeys[0] ?? null,
    publicKeys,
    secretKeys,
  };
}

function CodeBlock({
  title,
  code,
  onCopy,
}: {
  title: string;
  code: string;
  onCopy: (value: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#070A14]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
        <span className="text-xs font-medium text-[#94A3B8]">{title}</span>
        <button
          type="button"
          onClick={() => onCopy(code)}
          className="inline-flex items-center gap-1.5 text-xs text-[#38BDF8] hover:text-[#7DD3FC]"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[12px] leading-6 text-[#CBD5E1]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const SDK_PACKAGE = "@shubhashis9556/growthcloud-sdk";
const SDK_NPM_URL = "https://www.npmjs.com/package/@shubhashis9556/growthcloud-sdk";

function SdkConnectGuide({
  publicKeyValue,
  onCopy,
}: {
  publicKeyValue: string;
  onCopy: (value: string) => void;
}) {
  const [method, setMethod] = React.useState<InstallMethod>("npm");
  const keyForSnippet = publicKeyValue || "gc_pub_YOUR_PUBLIC_KEY";

  const scriptSnippet = `<script type="module">
  import { init } from 'https://cdn.jsdelivr.net/npm/${SDK_PACKAGE}@1.0.0/+esm';

  const growthcloud = init({
    publicKey: '${keyForSnippet}',
    autoCaptureForms: true,
    // baseUrl: 'http://localhost:4000',
  });

  growthcloud.track('page_viewed', {
    path: window.location.pathname
  });
</script>`;

  const npmInstall = `npm install ${SDK_PACKAGE}`;

  const npmSnippet = `import { init } from '${SDK_PACKAGE}';

const growthcloud = init({
  publicKey: '${keyForSnippet}',
  // Required in production — your Growth Cloud API URL:
  baseUrl: 'https://growth-cloud.onrender.com',
  autoCaptureForms: true, // optional: auto-send HTML form submits
});

// 1) Who is the user? (creates/updates a Lead — use on signup/login/checkout)
await growthcloud.identify('sarah@acme.com', {
  firstName: 'Sarah',
  lastName: 'Connor',
  company: 'Acme Corp',
  phone: '+1-555-0100',
  source: 'website',
  lifecycleStage: 'lead',
  // Send any extra fields you want:
  plan: 'pro',
  country: 'US',
});

// 2) What did they do? (any event name + any properties)
await growthcloud.track('added_to_cart', {
  productId: 'sku_123',
  value: 2999,
  currency: 'USD',
  pageUrl: window.location.href,
});

await growthcloud.track('purchase', {
  orderId: 'ORD-1001',
  value: 4999,
});

// 3) Full profile sync (optional alternative to identify)
await growthcloud.leadSync({
  email: 'sarah@acme.com',
  firstName: 'Sarah',
  company: 'Acme Corp',
  source: 'crm_sync',
});

// 4) Custom form payload (or rely on autoCaptureForms)
await growthcloud.submitForm('contact_us', {
  email: 'sarah@acme.com',
  message: 'Need a demo',
  budget: '10k',
});`;

  return (
    <SectionCard
      title="Connect the SDK"
      description="Install the published npm package, then initialize with your public key."
    >
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-[rgba(56,189,248,0.2)] bg-[rgba(56,189,248,0.06)] px-4 py-3">
        <Terminal className="h-4 w-4 shrink-0 text-[#38BDF8]" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[#94A3B8]">npm package</p>
          <code className="break-all text-sm text-[#F1F5F9]">{SDK_PACKAGE}</code>
        </div>
        <a
          href={SDK_NPM_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#070A14] px-3 text-xs font-medium text-[#38BDF8] hover:border-[rgba(56,189,248,0.35)]"
        >
          View on npm
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <button
          type="button"
          onClick={() => onCopy(npmInstall)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#38BDF8] px-3 text-xs font-semibold text-[#0B0F1A] hover:bg-[#38BDF8]/90"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy install
        </button>
      </div>

      <ol className="mb-5 space-y-3 text-sm text-[#CBD5E1]">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(56,189,248,0.12)] text-xs font-semibold text-[#38BDF8]">
            1
          </span>
          <span>
            Create a <strong className="text-[#F1F5F9]">Public (SDK)</strong> API key above and copy the full{" "}
            <code className="text-[#38BDF8]">gc_pub_…</code> value.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(56,189,248,0.12)] text-xs font-semibold text-[#38BDF8]">
            2
          </span>
          <span>
            Install with <code className="text-[#38BDF8]">npm install {SDK_PACKAGE}</code> (or use the script tag).
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(56,189,248,0.12)] text-xs font-semibold text-[#38BDF8]">
            3
          </span>
          <span>
            Initialize with your public key. Form submits are captured automatically when{" "}
            <code className="text-[#38BDF8]">autoCaptureForms: true</code>.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(56,189,248,0.12)] text-xs font-semibold text-[#38BDF8]">
            4
          </span>
          <span>
            Check <strong className="text-[#F1F5F9]">Leads</strong> — new visitors and form submissions appear there.
          </span>
        </li>
      </ol>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMethod("npm")}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium",
            method === "npm"
              ? "border-[rgba(56,189,248,0.35)] bg-[rgba(56,189,248,0.12)] text-[#38BDF8]"
              : "border-white/[0.08] bg-[#070A14] text-[#94A3B8] hover:text-[#F1F5F9]"
          )}
        >
          <Terminal className="h-4 w-4" />
          npm install
        </button>
        <button
          type="button"
          onClick={() => setMethod("script")}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium",
            method === "script"
              ? "border-[rgba(56,189,248,0.35)] bg-[rgba(56,189,248,0.12)] text-[#38BDF8]"
              : "border-white/[0.08] bg-[#070A14] text-[#94A3B8] hover:text-[#F1F5F9]"
          )}
        >
          <Code2 className="h-4 w-4" />
          Script / CDN
        </button>
      </div>

      {!publicKeyValue ? (
        <p className="mb-3 text-xs text-amber-300">
          No full public key loaded yet. Snippets use a placeholder — create/copy your public key first, then paste it in.
        </p>
      ) : null}

      {method === "script" ? (
        <div className="space-y-3">
          <p className="text-sm text-[#94A3B8]">
            Paste this before <code className="text-[#CBD5E1]">&lt;/body&gt;</code> on your website. Loads the same package from jsDelivr.
          </p>
          <CodeBlock title="HTML embed (ESM)" code={scriptSnippet} onCopy={onCopy} />
        </div>
      ) : (
        <div className="space-y-3">
          <CodeBlock title="Install from npm" code={npmInstall} onCopy={onCopy} />
          <CodeBlock title="Initialize in your app" code={npmSnippet} onCopy={onCopy} />
          <p className="text-xs text-[#64748B]">
            Package page:{" "}
            <a href={SDK_NPM_URL} target="_blank" rel="noreferrer" className="text-[#38BDF8] hover:underline">
              {SDK_NPM_URL}
            </a>
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { title: "identify()", detail: "Attach email + traits to a visitor" },
          { title: "track()", detail: "Send custom events for scoring/workflows" },
          { title: "submitForm()", detail: "Push form data into lead capture" },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-white/[0.08] bg-[#070A14] p-3">
            <div className="font-mono text-xs text-[#38BDF8]">{item.title}</div>
            <div className="mt-1 text-xs text-[#94A3B8]">{item.detail}</div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#F1F5F9]">{title}</h2>
          <p className="mt-1 text-sm text-[#94A3B8]">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function IntegrationsTabs() {
  const accessToken = useAuthSessionStore((state) => state.session?.accessToken ?? "");
  const sessionWorkspaceId = useAuthSessionStore(
    (state) => state.session?.workspaceId ?? state.session?.user?.memberships?.[0]?.workspaceId ?? ""
  );

  const [section, setSection] = React.useState<SectionId>("sdk");
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [apiKeys, setApiKeys] = React.useState<ApiKeySummary[]>([]);
  const [members, setMembers] = React.useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = React.useState<WorkspaceInvitation[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [sdkVisible, setSdkVisible] = React.useState(false);
  const [copyStatus, setCopyStatus] = React.useState<string | null>(null);
  const [createdPlaintextKey, setCreatedPlaintextKey] = React.useState<string | null>(null);

  const [apiKeyName, setApiKeyName] = React.useState("Website SDK Key");
  const [apiKeyType, setApiKeyType] = React.useState<"public" | "secret">("public");
  const [apiKeySaving, setApiKeySaving] = React.useState(false);

  const [memberEmail, setMemberEmail] = React.useState("");
  const [memberRole, setMemberRole] = React.useState<WorkspaceMember["role"]>("marketer");
  const [memberSaving, setMemberSaving] = React.useState(false);
  const [lastInviteUrl, setLastInviteUrl] = React.useState<string | null>(null);
  const [lastInviteEmailStatus, setLastInviteEmailStatus] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      setError("Authentication is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const workspaceResponse = await getWorkspaces(accessToken);
      const nextWorkspaces = workspaceResponse.data.workspaces;
      const nextWorkspaceId = selectedWorkspaceId || sessionWorkspaceId || nextWorkspaces[0]?.id || "";

      setWorkspaces(nextWorkspaces);
      setSelectedWorkspaceId(nextWorkspaceId);

      if (!nextWorkspaceId) {
        setApiKeys([]);
        setMembers([]);
        setInvitations([]);
        return;
      }

      const [apiKeyResponse, membersResponse, invitationsResponse] = await Promise.all([
        getApiKeys(nextWorkspaceId, accessToken),
        getWorkspaceMembers(nextWorkspaceId, accessToken),
        listInvitations(accessToken, nextWorkspaceId),
      ]);

      setApiKeys(apiKeyResponse.data.items);
      setMembers(membersResponse.data.items);
      setInvitations(invitationsResponse.data.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load integration data");
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedWorkspaceId, sessionWorkspaceId]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedWorkspace = workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null;
  const { publicKey, secretKey } = groupApiKeys(apiKeys);

  const displayPublicKey = createdPlaintextKey?.startsWith("gc_pub_")
    ? createdPlaintextKey
    : publicKey?.prefix
      ? `${publicKey.prefix}…`
      : null;

  const displaySecretKey = createdPlaintextKey?.startsWith("gc_live_")
    ? createdPlaintextKey
    : secretKey?.prefix
      ? `${secretKey.prefix}…`
      : null;

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus(null), 1500);
    } catch {
      setCopyStatus("Copy failed");
    }
  };

  const handleCreateApiKey = async () => {
    if (!selectedWorkspaceId || !accessToken) return;
    setApiKeySaving(true);
    setError(null);
    setSuccess(null);

    try {
      const scopes = apiKeyType === "public" ? PUBLIC_SCOPES : SECRET_SCOPES;
      const response = await createApiKey(
        {
          workspaceId: selectedWorkspaceId,
          name: apiKeyName.trim() || (apiKeyType === "public" ? "Website SDK Key" : "Backend Secret Key"),
          type: apiKeyType,
          scopes,
        },
        accessToken
      );

      setCreatedPlaintextKey(response.data.plaintextKey);
      setSdkVisible(true);
      setSuccess(
        apiKeyType === "public"
          ? "Public SDK key created. Copy it now — full key is shown only once."
          : "Secret API key created. Copy it now — full key is shown only once."
      );

      const keysResponse = await getApiKeys(selectedWorkspaceId, accessToken);
      setApiKeys(keysResponse.data.items);
      setSection("sdk");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to create API key");
    } finally {
      setApiKeySaving(false);
    }
  };

  const handleInviteMember = async () => {
    if (!selectedWorkspaceId || !accessToken || !memberEmail.trim()) return;
    setMemberSaving(true);
    setError(null);
    setSuccess(null);
    setLastInviteUrl(null);
    setLastInviteEmailStatus(null);

    try {
      const response = await sendInvitation(accessToken, selectedWorkspaceId, {
        email: memberEmail.trim(),
        role: memberRole,
      });

      const invitation = response.data.invitation;
      const inviteUrl =
        invitation.inviteUrl ||
        (invitation.inviteToken ? `${window.location.origin}/accept-invitation/${invitation.inviteToken}` : null);

      setLastInviteUrl(inviteUrl);
      setLastInviteEmailStatus(
        invitation.emailDelivered
          ? "Invitation email sent."
          : invitation.emailError
            ? `Invite created, but email failed: ${invitation.emailError}`
            : "Invite created. Share the link below."
      );
      setSuccess(
        invitation.emailDelivered
          ? `Invitation sent to ${invitation.email}`
          : `Invitation created for ${invitation.email}. Use the invite link below.`
      );
      setMemberEmail("");

      const [membersResponse, invitationsResponse] = await Promise.all([
        getWorkspaceMembers(selectedWorkspaceId, accessToken),
        listInvitations(accessToken, selectedWorkspaceId),
      ]);
      setMembers(membersResponse.data.items);
      setInvitations(invitationsResponse.data.items);
      setSection("team");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to invite member");
    } finally {
      setMemberSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-8 text-[#94A3B8]">
        Loading integrations…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#111827] px-5 py-4">
        <div>
          <div className="text-sm font-medium text-[#F1F5F9]">Workspace</div>
          <div className="mt-0.5 text-sm text-[#94A3B8]">
            {selectedWorkspace ? selectedWorkspace.name : "No workspace selected"}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedWorkspaceId}
            onValueChange={(value) => {
              if (!value) return;
              setSelectedWorkspaceId(value);
              setCreatedPlaintextKey(null);
            }}
          >
            <SelectTrigger className="h-10 min-w-[200px] rounded-lg border-white/[0.08] bg-[#070A14] text-[#F1F5F9]">
              <SelectValue placeholder="Select workspace" />
            </SelectTrigger>
            <SelectContent className="border-white/[0.08] bg-[#111827] text-[#F1F5F9]">
              {workspaces.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="h-10 rounded-lg border-white/[0.08] bg-transparent text-[#F1F5F9] hover:bg-white/5"
            onClick={() => void loadData()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "sdk", label: "SDK & API keys", icon: KeyRound },
            { id: "team", label: "Team invites", icon: Users2 },
            { id: "webhooks", label: "Webhooks", icon: Plug },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors",
                section === item.id
                  ? "border-[rgba(56,189,248,0.35)] bg-[rgba(56,189,248,0.12)] text-[#38BDF8]"
                  : "border-white/[0.08] bg-[#111827] text-[#94A3B8] hover:text-[#F1F5F9]"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#FCA5A5]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="flex items-start gap-2 rounded-xl border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.08)] px-4 py-3 text-sm text-[#6EE7B7]">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}

      {section === "sdk" ? (
        <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <SectionCard
            title="Website SDK key"
            description="Use the public key in your website or npm SDK to capture leads and events."
            action={
              publicKey ? (
                <Badge className="border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.1)] text-emerald-300">
                  Active
                </Badge>
              ) : (
                <Badge className="border border-white/[0.08] bg-[#1A1F2E] text-[#94A3B8]">Not created</Badge>
              )
            }
          >
            {displayPublicKey ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-white/[0.08] bg-[#070A14] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-[#64748B]">Public key</div>
                  <div className="mt-1 break-all font-mono text-sm text-[#F1F5F9]">
                    {sdkVisible || createdPlaintextKey?.startsWith("gc_pub_")
                      ? createdPlaintextKey?.startsWith("gc_pub_")
                        ? createdPlaintextKey
                        : displayPublicKey
                      : "••••••••••••••••••••"}
                  </div>
                  {publicKey ? (
                    <div className="mt-2 text-xs text-[#64748B]">
                      Name: {publicKey.name} · prefix {publicKey.prefix}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="h-9 rounded-lg border-white/[0.08] bg-transparent text-[#F1F5F9] hover:bg-white/5"
                    onClick={() =>
                      void handleCopy(
                        createdPlaintextKey?.startsWith("gc_pub_") ? createdPlaintextKey : publicKey?.prefix || ""
                      )
                    }
                    disabled={!publicKey && !createdPlaintextKey}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 rounded-lg border-white/[0.08] bg-transparent text-[#F1F5F9] hover:bg-white/5"
                    onClick={() => setSdkVisible((value) => !value)}
                  >
                    {sdkVisible ? <EyeOff className="mr-2 h-3.5 w-3.5" /> : <Eye className="mr-2 h-3.5 w-3.5" />}
                    {sdkVisible ? "Hide" : "Reveal"}
                  </Button>
                  {copyStatus ? <span className="self-center text-xs text-[#94A3B8]">{copyStatus}</span> : null}
                </div>
                {createdPlaintextKey?.startsWith("gc_pub_") ? (
                  <p className="text-xs text-amber-300">
                    Full key is visible only now. Store it securely before leaving this page.
                  </p>
                ) : (
                  <p className="text-xs text-[#64748B]">
                    Listed keys show prefix only. Create a new public key to reveal the full `gc_pub_…` value once.
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/[0.12] bg-[#070A14] px-4 py-8 text-center">
                <KeyRound className="mx-auto h-8 w-8 text-[#38BDF8]" />
                <p className="mt-3 text-sm font-medium text-[#F1F5F9]">No public SDK key yet</p>
                <p className="mt-1 text-sm text-[#94A3B8]">Create one on the right to connect your website.</p>
              </div>
            )}

            <div className="mt-6 border-t border-white/[0.06] pt-5">
              <div className="mb-3 text-sm font-medium text-[#F1F5F9]">Backend secret key</div>
              {displaySecretKey ? (
                <div className="rounded-xl border border-white/[0.08] bg-[#070A14] px-4 py-3 font-mono text-sm text-[#F1F5F9]">
                  {createdPlaintextKey?.startsWith("gc_live_") ? createdPlaintextKey : displaySecretKey}
                </div>
              ) : (
                <p className="text-sm text-[#64748B]">No active secret key. Create a secret key for server-side API calls.</p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Create API key" description="Public keys are for the browser SDK. Secret keys are for backend use.">
            <div className="space-y-3">
              <Input
                value={apiKeyName}
                onChange={(event) => setApiKeyName(event.target.value)}
                placeholder="Website SDK Key"
                className="h-10 rounded-lg border-white/[0.08] bg-[#070A14] text-[#F1F5F9]"
              />
              <Select
                value={apiKeyType}
                onValueChange={(value) => {
                  if (value === "public" || value === "secret") setApiKeyType(value);
                }}
              >
                <SelectTrigger className="h-10 rounded-lg border-white/[0.08] bg-[#070A14] text-[#F1F5F9]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/[0.08] bg-[#111827] text-[#F1F5F9]">
                  <SelectItem value="public">Public (SDK)</SelectItem>
                  <SelectItem value="secret">Secret (Backend)</SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="h-10 w-full rounded-lg bg-[#38BDF8] text-[#0B0F1A] hover:bg-[#38BDF8]/90"
                onClick={handleCreateApiKey}
                disabled={!selectedWorkspaceId || apiKeySaving}
              >
                {apiKeySaving ? "Creating…" : `Create ${apiKeyType} key`}
              </Button>
            </div>
          </SectionCard>
        </div>

          <SdkConnectGuide
            publicKeyValue={createdPlaintextKey?.startsWith("gc_pub_") ? createdPlaintextKey : ""}
            onCopy={(value) => void handleCopy(value)}
          />
        </div>
      ) : null}

      {section === "team" ? (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionCard title="Invite member" description="Sends an email invite with RBAC role. If email fails, copy the invite link.">
            <div className="space-y-3">
              <Input
                value={memberEmail}
                onChange={(event) => setMemberEmail(event.target.value)}
                placeholder="alex@company.com"
                type="email"
                className="h-10 rounded-lg border-white/[0.08] bg-[#070A14] text-[#F1F5F9]"
              />
              <Select
                value={memberRole}
                onValueChange={(value) => {
                  if (ROLES.includes(value as WorkspaceMember["role"])) {
                    setMemberRole(value as WorkspaceMember["role"]);
                  }
                }}
              >
                <SelectTrigger className="h-10 rounded-lg border-white/[0.08] bg-[#070A14] text-[#F1F5F9]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/[0.08] bg-[#111827] text-[#F1F5F9]">
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="h-10 w-full rounded-lg bg-[#38BDF8] text-[#0B0F1A] hover:bg-[#38BDF8]/90"
                onClick={handleInviteMember}
                disabled={!selectedWorkspaceId || memberSaving || !memberEmail.trim()}
              >
                <Mail className="mr-2 h-4 w-4" />
                {memberSaving ? "Sending invite…" : "Send invitation"}
              </Button>

              {lastInviteEmailStatus ? (
                <p className="text-xs text-[#94A3B8]">{lastInviteEmailStatus}</p>
              ) : null}

              {lastInviteUrl ? (
                <div className="rounded-xl border border-white/[0.08] bg-[#070A14] p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-[#64748B]">
                    <Link2 className="h-3.5 w-3.5" />
                    Invite link
                  </div>
                  <p className="break-all font-mono text-xs text-[#CBD5E1]">{lastInviteUrl}</p>
                  <Button
                    variant="outline"
                    className="mt-3 h-8 rounded-lg border-white/[0.08] bg-transparent text-[#F1F5F9] hover:bg-white/5"
                    onClick={() => void handleCopy(lastInviteUrl)}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Copy invite link
                  </Button>
                </div>
              ) : null}
            </div>
          </SectionCard>

          <div className="space-y-6">
            <SectionCard title="Pending invitations" description="Invites waiting to be accepted.">
              <div className="space-y-2">
                {invitations.length > 0 ? (
                  invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#070A14] px-4 py-3">
                      <div>
                        <div className="text-sm text-[#F1F5F9]">{invitation.email}</div>
                        <div className="mt-0.5 text-xs text-[#64748B]">{invitation.status}</div>
                      </div>
                      <Badge className="border border-white/[0.08] bg-[#1A1F2E] text-[#94A3B8]">{invitation.role}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#64748B]">No pending invitations.</p>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Connected team" description="Members already in this workspace.">
              <div className="space-y-2">
                {members.length > 0 ? (
                  members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#070A14] px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-[#F1F5F9]">{member.name}</div>
                        <div className="mt-0.5 font-mono text-xs text-[#64748B]">{member.email}</div>
                      </div>
                      <Badge className="border border-white/[0.08] bg-[#1A1F2E] text-[#94A3B8]">{member.role}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#64748B]">No members found.</p>
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      ) : null}

      {section === "webhooks" ? <WebhooksManager /> : null}
    </div>
  );
}
