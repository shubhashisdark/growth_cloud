const DEFAULT_BACKEND_URL = "http://localhost:4000";

import type { AuthUser } from "@/lib/stores/auth-session";

export interface BackendErrorResponse {
  data: null;
  meta: {
    timestamp: string;
  };
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface BackendSuccessResponse<T> {
  data: T;
  meta: {
    timestamp: string;
  };
  error: null;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  workspaceName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  timezone: string;
  status: string;
  ownerId: string;
  createdAt: string;
  owner?: { id: string; name: string; email: string };
  _count?: { memberships: number; apiKeys: number; leads: number };
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "marketer" | "developer" | "sales" | "viewer";
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceMember["role"];
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
}

export interface ApiKeySummary {
  id: string;
  workspaceId: string;
  name: string;
  prefix: string;
  type: "public" | "secret";
  status: "active" | "revoked";
  scopes: string[];
  lastUsedAt: string | null;
  usageCount: number;
  secretPreview: string | null;
}

export interface BackendAuthPayload {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_BACKEND_URL;
}

export function getBackendUrl(path: string) {
  return new URL(path, getBackendBaseUrl()).toString();
}

export async function fetchBackendJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(getBackendUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    try {
      const body = (await response.json()) as Partial<BackendErrorResponse>;
      throw new Error(body.error?.message ?? `Backend request failed with status ${response.status}`);
    } catch (err) {
      if (err instanceof Error) throw err;
      throw new Error(`Backend request failed with status ${response.status}`);
    }
  }

  return response.json() as Promise<T>;
}

// AUTH API CALLS
export function signup(payload: SignupPayload) {
  return fetchBackendJson<BackendSuccessResponse<{ user: AuthUser; workspace: Workspace; verificationToken: string | null }>>("/api/v1/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function login(payload: LoginPayload) {
  return fetchBackendJson<BackendSuccessResponse<BackendAuthPayload>>("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function logout(accessToken: string) {
  return fetchBackendJson<BackendSuccessResponse<{ success: boolean }>>("/api/v1/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getMe(accessToken: string) {
  return fetchBackendJson<BackendSuccessResponse<{ user: AuthUser & { emailVerifiedAt: string | null } }>>("/api/v1/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function verifyEmail(token: string) {
  return fetchBackendJson<BackendSuccessResponse<{ verified: boolean }>>("/api/v1/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

export function resendVerification(email: string) {
  return fetchBackendJson<BackendSuccessResponse<{ email: string; delivered: boolean; message: string }>>("/api/v1/auth/resend-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export function forgotPassword(payload: ForgotPasswordPayload) {
  return fetchBackendJson<BackendSuccessResponse<{ email: string; delivered: boolean; resetToken: string | null }>>("/api/v1/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function resetPassword(token: string, password: string) {
  return fetchBackendJson<BackendSuccessResponse<{ reset: boolean }>>("/api/v1/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
}

export function acceptInvitation(token: string, name: string, password: string) {
  return fetchBackendJson<BackendSuccessResponse<{ accepted: boolean; user: AuthUser }>>("/api/v1/auth/invites/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, name, password }),
  });
}

// WORKSPACE API CALLS
export function getWorkspaces(accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<{ workspaces: Workspace[] }>>("/api/v1/workspaces", {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
}

export function getWorkspace(accessToken: string, workspaceId: string) {
  return fetchBackendJson<BackendSuccessResponse<{ workspace: Workspace }>>(`/api/v1/workspaces/${workspaceId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createWorkspace(accessToken: string, payload: { name: string; slug?: string; timezone?: string }) {
  return fetchBackendJson<BackendSuccessResponse<{ workspace: Workspace }>>("/api/v1/workspaces", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function updateWorkspace(accessToken: string, workspaceId: string, payload: { name?: string; slug?: string; timezone?: string }) {
  return fetchBackendJson<BackendSuccessResponse<{ workspace: Workspace }>>(`/api/v1/workspaces/${workspaceId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function getWorkspaceMembers(workspaceId: string, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<{ items: WorkspaceMember[] }>>(`/api/v1/workspaces/${workspaceId}/members`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
}

export function createWorkspaceMember(payload: { workspaceId: string; name: string; email: string; role: WorkspaceMember["role"] }, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<WorkspaceMember>>(`/api/v1/workspaces/${payload.workspaceId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ name: payload.name, email: payload.email, role: payload.role }),
  });
}

export function removeWorkspaceMember(accessToken: string, workspaceId: string, userId: string) {
  return fetchBackendJson<BackendSuccessResponse<{ success: boolean }>>(`/api/v1/workspaces/${workspaceId}/members/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function updateWorkspaceMemberRole(accessToken: string, workspaceId: string, userId: string, role: WorkspaceMember["role"]) {
  return fetchBackendJson<BackendSuccessResponse<WorkspaceMember>>(`/api/v1/workspaces/${workspaceId}/members/${userId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role }),
  });
}

export function sendInvitation(accessToken: string, workspaceId: string, payload: { email: string; role: WorkspaceMember["role"] }) {
  return fetchBackendJson<BackendSuccessResponse<{ invitation: WorkspaceInvitation & { inviteToken?: string | null } }>>(`/api/v1/workspaces/${workspaceId}/invitations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function listInvitations(accessToken: string, workspaceId: string) {
  return fetchBackendJson<BackendSuccessResponse<{ items: WorkspaceInvitation[] }>>(`/api/v1/workspaces/${workspaceId}/invitations`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function revokeInvitation(accessToken: string, workspaceId: string, invitationId: string) {
  return fetchBackendJson<BackendSuccessResponse<{ success: boolean }>>(`/api/v1/workspaces/${workspaceId}/invitations/${invitationId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export interface ApiUsageItem {
  id: string;
  apiKeyId: string;
  apiKeyName: string;
  prefix: string;
  path: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export function getApiKeys(workspaceId?: string, accessToken?: string) {
  const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
  return fetchBackendJson<BackendSuccessResponse<{ items: ApiKeySummary[]; total: number }>>(`/api/v1/api-keys${query}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
}

export function createApiKey(payload: { workspaceId?: string; name: string; type: "public" | "secret"; scopes: string[]; expiresAt?: string | null }, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<{ apiKey: ApiKeySummary; plaintextKey: string }>>("/api/v1/api-keys", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });
}

export function rotateApiKey(apiKeyId: string, workspaceId?: string, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<{ apiKey: ApiKeySummary; plaintextKey: string }>>(`/api/v1/api-keys/${apiKeyId}/rotate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ workspaceId }),
  });
}

export function revokeApiKey(apiKeyId: string, workspaceId?: string, reason?: string, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<ApiKeySummary>>(`/api/v1/api-keys/${apiKeyId}/revoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ workspaceId, reason }),
  });
}

export function deleteApiKey(apiKeyId: string, workspaceId?: string, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<ApiKeySummary>>(`/api/v1/api-keys/${apiKeyId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ workspaceId }),
  });
}

export function getApiKeyUsage(workspaceId?: string, apiKeyId?: string, accessToken?: string) {
  const params = new URLSearchParams();
  if (workspaceId) params.set("workspaceId", workspaceId);
  if (apiKeyId) params.set("apiKeyId", apiKeyId);
  const query = params.toString() ? `?${params.toString()}` : "";

  return fetchBackendJson<BackendSuccessResponse<{ keys: ApiKeySummary[]; usage: ApiUsageItem[] }>>(`/api/v1/api-keys/usage${query}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
}

export function parseFrontendError(error: unknown, fallback = "An unexpected error occurred"): string {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    if (error.message === "An account with this email already exists") {
      return "An account with this email already exists. Use sign in or reset your password.";
    }
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return fallback;
}

// ─────────────────────────────────────────────
// LEADS API
// ─────────────────────────────────────────────

export type LeadStage = "subscriber" | "lead" | "mql" | "sql" | "customer";
export type LeadStatus = "active" | "archived";

export interface LeadConsent {
  id: string;
  type: "email" | "sms";
  granted: boolean;
  source?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadNote {
  id: string;
  note: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadTimelineEvent {
  id: string;
  type: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Lead {
  id: string;
  workspaceId: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  source: string;
  status: LeadStatus;
  score: number;
  lifecycleStage: LeadStage;
  tags: string[];
  customFields: Record<string, string>;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  notes?: LeadNote[];
  consents?: LeadConsent[];
  timeline?: LeadTimelineEvent[];
}

export interface LeadListResponse {
  data: { items: Lead[] };
  meta: { total: number; page: number; limit: number; hasNext: boolean; timestamp: string };
  error: null;
}

export interface CreateLeadPayload {
  email: string;
  firstName: string;
  lastName?: string;
  company?: string;
  source?: string;
  lifecycleStage?: LeadStage;
  tags?: string[];
  consentEmail?: boolean;
  consentSms?: boolean;
  customFields?: Record<string, string>;
  assignedToId?: string | null;
}

export interface UpdateLeadPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  source?: string;
  lifecycleStage?: LeadStage;
  status?: LeadStatus;
  tags?: string[];
  customFields?: Record<string, string>;
  assignedToId?: string | null;
}

export function getAuthHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function _authHeaders(token?: string): Record<string, string> {
  return getAuthHeaders(token);
}

export function listLeads(workspaceId: string, params: { q?: string; stage?: LeadStage; status?: LeadStatus; source?: string; sortBy?: string; sortOrder?: "asc" | "desc"; page?: number; limit?: number; }, accessToken?: string) {
  const query = new URLSearchParams({ workspaceId });
  for (const [k, v] of Object.entries(params)) { if (v !== undefined && v !== "") query.set(k, String(v)); }
  return fetchBackendJson<LeadListResponse>(`/api/v1/leads?${query.toString()}`, { headers: _authHeaders(accessToken) });
}

export function getLead(leadId: string, workspaceId: string, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<Lead>>(`/api/v1/leads/${leadId}?workspaceId=${encodeURIComponent(workspaceId)}`, { headers: _authHeaders(accessToken) });
}

export function createLead(workspaceId: string, payload: CreateLeadPayload, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<Lead>>("/api/v1/leads", { method: "POST", headers: { "Content-Type": "application/json", ..._authHeaders(accessToken) }, body: JSON.stringify({ ...payload, workspaceId }) });
}

export function updateLead(leadId: string, workspaceId: string, payload: UpdateLeadPayload, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<Lead>>(`/api/v1/leads/${leadId}`, { method: "PATCH", headers: { "Content-Type": "application/json", "X-Workspace-Id": workspaceId, ..._authHeaders(accessToken) }, body: JSON.stringify(payload) });
}

export function deleteLead(leadId: string, workspaceId: string, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<Lead>>(`/api/v1/leads/${leadId}`, { method: "DELETE", headers: { "X-Workspace-Id": workspaceId, ..._authHeaders(accessToken) } });
}

export function addLeadNote(leadId: string, workspaceId: string, note: string, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<LeadNote>>(`/api/v1/leads/${leadId}/notes`, { method: "POST", headers: { "Content-Type": "application/json", "X-Workspace-Id": workspaceId, ..._authHeaders(accessToken) }, body: JSON.stringify({ note }) });
}

export function getLeadTimeline(leadId: string, workspaceId: string, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<{ leadId: string; timeline: LeadTimelineEvent[] }>>(`/api/v1/leads/timeline/${leadId}`, { headers: { "X-Workspace-Id": workspaceId, ..._authHeaders(accessToken) } });
}

export function bulkLeadAction(workspaceId: string, payload: { leadIds: string[]; action: "archive" | "activate" | "advance_stage"; stage?: LeadStage }, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<{ updated: number }>>("/api/v1/leads/bulk", { method: "POST", headers: { "Content-Type": "application/json", "X-Workspace-Id": workspaceId, ..._authHeaders(accessToken) }, body: JSON.stringify(payload) });
}

export function updateLeadConsent(leadId: string, workspaceId: string, type: "email" | "sms", granted: boolean, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<LeadConsent>>(`/api/v1/leads/${leadId}/consents`, { method: "PATCH", headers: { "Content-Type": "application/json", "X-Workspace-Id": workspaceId, ..._authHeaders(accessToken) }, body: JSON.stringify({ type, granted }) });
}

export function exportLeadsCsv(workspaceId: string, accessToken?: string) {
  return fetch(getBackendUrl(`/api/v1/leads/export?workspaceId=${encodeURIComponent(workspaceId)}`), { headers: _authHeaders(accessToken) });
}

export function importLeadsCsv(workspaceId: string, csvText: string, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<{ imported: number; errors: string[] }>>("/api/v1/leads/import", { method: "POST", headers: { "Content-Type": "text/plain", "X-Workspace-Id": workspaceId, ..._authHeaders(accessToken) }, body: csvText });
}

// ─────────────────────────────────────────────
// EMAIL MARKETING API
// ─────────────────────────────────────────────

export interface EmailTemplateItem {
  id: string;
  workspaceId: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EmailCampaignItem {
  id: string;
  workspaceId: string;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string | null;
  templateId: string | null;
  status: "draft" | "scheduled" | "sending" | "sent" | "paused" | "cancelled";
  scheduledAt: string | null;
  sentAt: string | null;
  totalRecipients: number;
  sentCount: number;
  openCount: number;
  clickCount: number;
  bounceCount: number;
  unsubscribeCount: number;
  createdAt: string;
  updatedAt: string;
  template?: EmailTemplateItem | null;
  jobs?: Array<{ id: string; recipientEmail: string; status: string; sentAt: string | null }>;
  events?: Array<{ id: string; eventType: string; recipientEmail: string; createdAt: string }>;
}

export interface EmailSuppressionItem {
  id: string;
  workspaceId: string;
  email: string;
  reason: string;
  createdAt: string;
}

export function listEmailTemplates(workspaceId: string, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<{ items: EmailTemplateItem[] }>>("/api/v1/email/templates", {
    headers: { "X-Workspace-Id": workspaceId, ..._authHeaders(accessToken) },
  });
}

export function createEmailTemplate(workspaceId: string, payload: { name: string; subject: string; htmlContent: string; textContent?: string; variables?: string[] }, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<EmailTemplateItem>>("/api/v1/email/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Workspace-Id": workspaceId, ..._authHeaders(accessToken) },
    body: JSON.stringify(payload),
  });
}

export function updateEmailTemplate(templateId: string, workspaceId: string, payload: { name?: string; subject?: string; htmlContent?: string; textContent?: string; variables?: string[] }, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<EmailTemplateItem>>(`/api/v1/email/templates/${templateId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "X-Workspace-Id": workspaceId, ..._authHeaders(accessToken) },
    body: JSON.stringify(payload),
  });
}

export function deleteEmailTemplate(templateId: string, workspaceId: string, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<{ success: boolean }>>(`/api/v1/email/templates/${templateId}`, {
    method: "DELETE",
    headers: { "X-Workspace-Id": workspaceId, ..._authHeaders(accessToken) },
  });
}

export function listEmailCampaigns(workspaceId: string, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<{ items: EmailCampaignItem[] }>>("/api/v1/email/campaigns", {
    headers: { "X-Workspace-Id": workspaceId, ..._authHeaders(accessToken) },
  });
}

export function getEmailCampaign(campaignId: string, workspaceId: string, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<EmailCampaignItem>>(`/api/v1/email/campaigns/${campaignId}`, {
    headers: { "X-Workspace-Id": workspaceId, ..._authHeaders(accessToken) },
  });
}

export function createEmailCampaign(workspaceId: string, payload: { name: string; subject: string; fromName?: string; fromEmail?: string; templateId?: string; scheduledAt?: string }, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<EmailCampaignItem>>("/api/v1/email/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Workspace-Id": workspaceId, ..._authHeaders(accessToken) },
    body: JSON.stringify(payload),
  });
}

export function sendEmailCampaign(campaignId: string, workspaceId: string, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<{ campaign: EmailCampaignItem; dispatchedCount: number }>>(`/api/v1/email/campaigns/${campaignId}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Workspace-Id": workspaceId, ..._authHeaders(accessToken) },
  });
}

export function deleteEmailCampaign(campaignId: string, workspaceId: string, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<{ success: boolean }>>(`/api/v1/email/campaigns/${campaignId}`, {
    method: "DELETE",
    headers: { "X-Workspace-Id": workspaceId, ..._authHeaders(accessToken) },
  });
}

export function sendSingleEmail(workspaceId: string, payload: { to: string; recipientName?: string; subject: string; html: string; text?: string; variables?: Record<string, string> }, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<{ jobId: string; to: string; status: string }>>("/api/v1/email/send-single", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Workspace-Id": workspaceId, ..._authHeaders(accessToken) },
    body: JSON.stringify(payload),
  });
}

export function listEmailSuppressions(workspaceId: string, accessToken?: string) {
  return fetchBackendJson<BackendSuccessResponse<{ items: EmailSuppressionItem[] }>>("/api/v1/email/suppressions", {
    headers: { "X-Workspace-Id": workspaceId, ..._authHeaders(accessToken) },
  });
}

export function runAiTool(workspaceId: string, type: string, input: Record<string, unknown>, accessToken?: string) {
  return fetchBackendJson<{ data: any }>("/api/v1/ai/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Workspace-Id": workspaceId,
      ..._authHeaders(accessToken)
    },
    body: JSON.stringify({ type, input, stream: false, retries: 1 })
  });
}

