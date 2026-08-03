# CodeMate Growth Cloud — Platform Roadmap

> **Source of truth**: PRD/TRD Final Version
> **Stack**: Express (NestJS-ready) · PostgreSQL · Prisma · Redis + BullMQ · Next.js · Tailwind · OpenAI
> **Last updated**: 2026-08-02

---

## How to read this document

Each phase lists:
- **Status** — overall readiness at the module level
- **Backend** — Express modules, routes, services, jobs
- **Frontend** — Next.js pages and components
- **Database** — Prisma schema changes required
- **Done when** — acceptance criteria from the PRD

Statuses:
- ? Done — shipped and verified
- ?? Partial — code exists but incomplete or untested
- ?? Not started — no implementation yet

---

## Phase 1 — Foundation: Website · Auth · Workspace · API Keys

> **Goal**: A visitor can find and learn about the platform, sign up, create a workspace, and generate API keys to start integrating.

---

### 1.1 Public Marketing Website

| Status | Item |
|--------|------|
| ?? | Home page — hero, features overview, social proof, CTA |
| ?? | Features page — detailed breakdown of all modules |
| ?? | Pricing page — plan tiers, feature table, CTA |
| ?? | API Docs page — embedded or linked reference docs |
| ?? | Contact page — contact form, support info |
| ?? | Legal pages — Privacy Policy, Terms of Service, Cookie Policy |
| ?? | Shared layout — navbar, footer, mobile responsive |
| ?? | SEO — meta tags, Open Graph, sitemap |

**Frontend files to create**
- `app/(marketing)/page.tsx` — Home
- `app/(marketing)/features/page.tsx`
- `app/(marketing)/pricing/page.tsx`
- `app/(marketing)/docs/page.tsx`
- `app/(marketing)/contact/page.tsx`
- `app/(marketing)/legal/privacy/page.tsx`
- `app/(marketing)/legal/terms/page.tsx`
- `app/(marketing)/layout.tsx` — marketing shell with nav/footer

**Done when**
- All pages are mobile responsive with clear CTAs
- Visitors can navigate to signup or API docs from any page

---

### 1.2 Authentication

| Status | Item |
|--------|------|
| ?? | Signup — route exists in `auth.routes.ts`, needs layered service/controller |
| ?? | Login — exists, needs session/JWT hardening and HttpOnly cookie strategy |
| ?? | Logout — exists, needs token invalidation and session cleanup |
| ?? | Email verification — token model exists in schema; flow needs wiring |
| ?? | Password reset — `PasswordResetToken` model exists; email delivery missing |
| ?? | Refresh tokens — `Session` model with `refreshHash` exists; endpoint missing |
| ?? | Resend verification email endpoint |
| ?? | Frontend login page — connected to real API (currently localStorage-based) |
| ?? | Frontend signup page — connected to real API |
| ?? | Frontend forgot-password page — connected to real API |
| ?? | Frontend email verification page |
| ?? | Frontend password reset page |
| ?? | Route guard middleware — redirect unauthenticated users |
| ?? | Audit logs on login, logout, and failed attempts |

**Backend files to create/refactor**
- `backend/src/modules/auth/dto/` — request/response shapes
- `backend/src/modules/auth/repositories/` — Prisma access
- `backend/src/modules/auth/services/` — business rules, token generation
- `backend/src/modules/auth/controllers/` — HTTP handlers
- `backend/src/modules/auth/validators.ts` — Zod schemas (extend existing)
- `backend/src/lib/mailer.ts` — email delivery wrapper (SendGrid/SES)

**Frontend files to create/refactor**
- `app/login/page.tsx` — rework to real API calls
- `app/signup/page.tsx` — rework to real API calls
- `app/forgot-password/page.tsx` — rework to real API calls
- `app/verify-email/page.tsx` — new
- `app/reset-password/page.tsx` — new
- `hooks/useAuth.ts` — auth state, session management
- `lib/api.ts` — central fetch client with token refresh

**Done when**
- User can sign up, verify email, log in, and log out
- Password reset flow works end-to-end
- Sessions expire and refresh correctly
- Audit logs capture auth events

---

### 1.3 Workspace Management

| Status | Item |
|--------|------|
| ?? | Create workspace — `workspaces.routes.ts` exists, no service layer |
| ?? | RBAC roles — `WorkspaceRole` enum in schema; not enforced in middleware |
| ?? | Workspace members — `WorkspaceMember` model exists; endpoints missing |
| ?? | Team invitations — `WorkspaceInvitation` model exists; flow not wired |
| ?? | Accept invitation endpoint and page |
| ?? | List workspace members endpoint |
| ?? | Remove workspace member endpoint |
| ?? | Update member role endpoint |
| ?? | Workspace settings — update name, slug, timezone |
| ?? | Workspace-aware auth middleware (attach workspace context to req) |
| ?? | Frontend workspace creation flow |
| ?? | Frontend team members page |
| ?? | Frontend invitation acceptance page |
| ?? | Onboarding checklist page |

**Backend files to create/refactor**
- `backend/src/modules/workspaces/dto/`
- `backend/src/modules/workspaces/repositories/`
- `backend/src/modules/workspaces/services/`
- `backend/src/modules/workspaces/controllers/`
- `backend/src/middleware/workspace.middleware.ts` — resolves workspace from session/API key

**Frontend files to create**
- `app/(app)/settings/team/page.tsx` — member list, invite, remove
- `app/(app)/settings/workspace/page.tsx` — name, slug, timezone
- `app/accept-invitation/[token]/page.tsx` — new member acceptance
- `app/(app)/onboarding/page.tsx` — checklist flow

**Done when**
- User can create workspaces and invite team members by email
- Invitees can accept and join the workspace
- RBAC roles are enforced on all workspace-scoped routes
- Workspace settings can be updated

---

### 1.4 API Key Management

| Status | Item |
|--------|------|
| ?? | Create key — logic in `api-key.service.ts`, needs layered refactor |
| ?? | Rotate key — exists in service, needs controller/routes cleanup |
| ?? | Revoke key — exists in service, needs controller/routes cleanup |
| ?? | Delete key — exists in service, needs controller/routes cleanup |
| ?? | Usage tracking — `ApiKeyUsage` model exists; tracking not fully wired |
| ?? | Auth middleware — bearer token lookup exists; workspace resolution incomplete |
| ?? | Public key type (prefix `cm_pub_`) + Secret key type (prefix `cm_live_`) |
| ?? | Allowed domain configuration for public keys |
| ?? | Key scoping (permissions list per key) |
| ?? | Key expiration enforcement on auth |
| ?? | Frontend API key list page — replace static placeholder |
| ?? | Frontend API key usage page |
| ?? | Frontend copy-to-clipboard and one-time reveal for new keys |
| ?? | Audit logs for all key lifecycle actions |

> Full implementation plan: [`plans/api-key-management-plan.md`](./api-key-management-plan.md)

**Backend files to create/refactor**
- `backend/src/modules/api-keys/dto/`
- `backend/src/modules/api-keys/repositories/`
- `backend/src/modules/api-keys/services/`
- `backend/src/modules/api-keys/controllers/`
- `backend/src/modules/api-keys/middleware/authenticate.ts`

**Frontend files to create/refactor**
- `app/(app)/dashboard/api-keys/page.tsx` — replace static UI
- `app/(app)/dashboard/api-keys/usage/page.tsx` — new
- `app/(app)/settings/page.tsx` — link to API key management

**API endpoints**
```
GET    /api/v1/api-keys
POST   /api/v1/api-keys
POST   /api/v1/api-keys/:id/rotate
POST   /api/v1/api-keys/:id/revoke
DELETE /api/v1/api-keys/:id
GET    /api/v1/api-keys/usage
POST   /api/v1/api-keys/authenticate
```

**Done when**
- Keys authenticate API requests and scope them to a workspace
- Revoked/expired/deleted keys are rejected
- Usage is tracked per key
- Frontend surfaces key management and telemetry

---

## Phase 2 — Core Platform: Leads · Email · Workflows

> **Goal**: Users can capture leads via API, send email campaigns, and automate communication through workflow triggers.

---

### 2.1 Lead Management

| Status | Item |
|--------|------|
| ?? | CRUD endpoints — `leads.routes.ts` + `leads.service.ts` exist; needs layered refactor |
| ?? | Tags — `tagsJson` stored on lead; no dedicated tag endpoints |
| ?? | Custom fields — `customFieldsJson` stored on lead; no endpoints |
| ?? | Assignment — `LeadAssignment` model exists; endpoint missing |
| ?? | Activity timeline — `LeadActivity` model exists; no list endpoint |
| ?? | Notes — `LeadNote` model exists; no endpoints |
| ?? | Consent — `LeadConsent` model exists; no endpoints |
| ?? | Lead search and filtering (by source, stage, score, tag, date) |
| ?? | Lead import from CSV |
| ?? | Lead export to CSV |
| ?? | Lead score manual update endpoint |
| ?? | Deduplication on email match |
| ?? | Frontend lead list page — replace static placeholder |
| ?? | Frontend lead detail page — timeline, score, notes, tags |
| ?? | Frontend lead import UI |

**Backend files to create/refactor**
- `backend/src/modules/leads/dto/`
- `backend/src/modules/leads/repositories/`
- `backend/src/modules/leads/services/`
- `backend/src/modules/leads/controllers/`

**Frontend files to create/refactor**
- `app/(app)/leads/page.tsx` — list with filter/search
- `app/(app)/leads/[id]/page.tsx` — detail view, timeline, notes
- `app/(app)/leads/import/page.tsx` — CSV import

**API endpoints**
```
POST   /api/v1/leads
GET    /api/v1/leads
GET    /api/v1/leads/:id
PATCH  /api/v1/leads/:id
DELETE /api/v1/leads/:id
POST   /api/v1/leads/:id/tags
DELETE /api/v1/leads/:id/tags/:tag
POST   /api/v1/leads/:id/score
POST   /api/v1/leads/:id/assign
GET    /api/v1/leads/:id/activities
POST   /api/v1/leads/:id/notes
GET    /api/v1/leads/:id/notes
POST   /api/v1/leads/import
GET    /api/v1/leads/export
```

**Database additions needed**
- Add unique index on `email + workspaceId` for deduplication
- Consider separate `CustomField` definition model for schema-driven fields

**Done when**
- Leads can be created, updated, searched, filtered via API and dashboard
- Activity timeline shows all events for a lead
- Tags and custom fields are manageable
- Import/export works

---

### 2.2 Email Marketing

| Status | Item |
|--------|------|
| ?? | Email service — `email.service.ts` exists; stub/skeleton only |
| ?? | Email templates — create, update, list, delete |
| ?? | Send single email |
| ?? | Send bulk email campaign |
| ?? | Schedule email |
| ?? | Email open tracking (pixel) |
| ?? | Email click tracking (redirect) |
| ?? | Unsubscribe handling and suppression list |
| ?? | Bounce and complaint handling |
| ?? | Email personalization via template variables |
| ?? | Campaign creation and audience selection |
| ?? | Campaign status management (draft, scheduled, sent, paused) |
| ?? | Provider integration (SendGrid or SES) |
| ?? | Frontend campaigns page |
| ?? | Frontend template editor |
| ?? | Frontend campaign stats page |

**Backend files to create**
- `backend/src/modules/email/dto/`
- `backend/src/modules/email/repositories/`
- `backend/src/modules/email/services/email-send.service.ts`
- `backend/src/modules/email/services/email-template.service.ts`
- `backend/src/modules/email/services/email-campaign.service.ts`
- `backend/src/modules/email/controllers/`
- `backend/src/modules/email/jobs/email-send.job.ts` — BullMQ worker
- `backend/src/lib/email-provider.ts` — SendGrid/SES adapter

**Frontend files to create/refactor**
- `app/(app)/campaigns/page.tsx` — list, create
- `app/(app)/campaigns/[id]/page.tsx` — detail, stats, audience
- `app/(app)/campaigns/templates/page.tsx` — template list
- `app/(app)/campaigns/templates/[id]/page.tsx` — template editor

**Database additions needed**
```
EmailTemplate   — id, workspaceId, name, subject, bodyHtml, bodyText, variablesJson
EmailCampaign   — id, workspaceId, name, templateId, audienceType, audienceJson, scheduledAt, status
EmailSend       — id, workspaceId, leadId, campaignId, status, openedAt, clickedAt, bouncedAt
SuppressionList — id, workspaceId, email, reason, createdAt
```

**API endpoints**
```
POST   /api/v1/emails/send
POST   /api/v1/emails/schedule
GET    /api/v1/email-templates
POST   /api/v1/email-templates
GET    /api/v1/email-templates/:id
PATCH  /api/v1/email-templates/:id
DELETE /api/v1/email-templates/:id
GET    /api/v1/email-campaigns
POST   /api/v1/email-campaigns
GET    /api/v1/email-campaigns/:id
GET    /api/v1/email-campaigns/:id/stats
POST   /api/v1/leads/:id/unsubscribe
GET    /t/:trackingId/open             (tracking pixel)
GET    /t/:trackingId/click/:linkId    (click redirect)
```

**Done when**
- Emails can be sent to individual leads and bulk campaigns
- Opens and clicks are tracked
- Unsubscribers are excluded from future sends
- Templates support personalization variables

---

### 2.3 Automation Workflow Engine

| Status | Item |
|--------|------|
| ?? | Workflow model — `Workflow` in schema with `definitionJson`; routes stub exists |
| ?? | Workflow creation with trigger + step definition |
| ?? | Enable/disable workflows |
| ?? | Trigger matching — `lead.created`, `lead.updated`, `email.opened`, `email.clicked`, `score.changed` |
| ?? | Inactivity trigger |
| ?? | Workflow execution engine — step-by-step processing |
| ?? | Action nodes: send email, update score, add tag, change status, notify sales, fire webhook |
| ?? | Condition nodes: branch on field value, score threshold, segment membership |
| ?? | Delay nodes: wait N hours/days, resume via BullMQ scheduled job |
| ?? | Workflow execution logs |
| ?? | Step execution logs |
| ?? | Re-entry and frequency controls |
| ?? | Retry on failure with backoff |
| ?? | Manual trigger endpoint |
| ?? | Frontend workflow builder UI |
| ?? | Frontend execution history page |

**Backend files to create/refactor**
- `backend/src/modules/workflows/dto/`
- `backend/src/modules/workflows/repositories/`
- `backend/src/modules/workflows/services/workflow.service.ts`
- `backend/src/modules/workflows/services/workflow-engine.service.ts`
- `backend/src/modules/workflows/services/trigger-matcher.service.ts`
- `backend/src/modules/workflows/controllers/`
- `backend/src/modules/workflows/jobs/workflow-step.job.ts`
- `backend/src/modules/workflows/jobs/workflow-delay.job.ts`

**Frontend files to create/refactor**
- `app/(app)/workflows/page.tsx` — list
- `app/(app)/workflows/[id]/page.tsx` — builder/editor
- `app/(app)/workflows/[id]/executions/page.tsx` — execution history

**Database additions needed**
```
WorkflowExecution     — id, workspaceId, workflowId, leadId, status, currentStepIndex
WorkflowStepExecution — id, workflowExecutionId, stepIndex, stepType, status, inputJson, outputJson
```

**API endpoints**
```
POST   /api/v1/workflows
GET    /api/v1/workflows
GET    /api/v1/workflows/:id
PATCH  /api/v1/workflows/:id
POST   /api/v1/workflows/:id/enable
POST   /api/v1/workflows/:id/disable
POST   /api/v1/workflows/:id/trigger
GET    /api/v1/workflows/:id/executions
GET    /api/v1/workflows/:id/executions/:execId
```

**Done when**
- Workflows trigger automatically on platform events
- All node types (action, condition, delay) execute correctly
- Execution logs show each step result
- Failures are retried with backoff and surfaced in the UI

---

## Phase 3 — Intelligence: Scoring · Segmentation · Webhooks · Notifications

> **Goal**: The platform scores leads automatically, groups them into dynamic segments, fires events to external systems, and notifies team members.

---

### 3.1 Lead Scoring

| Status | Item |
|--------|------|
| ?? | Score field — on `Lead` model; no scoring rule engine |
| ?? | Score rule model — create, update, delete, list rules |
| ?? | Score rule engine — apply matching rules on events |
| ?? | Score history — delta log per event |
| ?? | Threshold alerts — notify when score crosses a value |
| ?? | Re-evaluate segments/workflows on score change |
| ?? | Default scoring rules seeded per workspace |
| ?? | Frontend scoring rules page |
| ?? | Frontend lead score history chart |

**Backend files to create**
- `backend/src/modules/scoring/dto/`
- `backend/src/modules/scoring/repositories/`
- `backend/src/modules/scoring/services/score-rule.service.ts`
- `backend/src/modules/scoring/services/score-engine.service.ts`
- `backend/src/modules/scoring/controllers/`

**Database additions needed**
```
ScoreRule    — id, workspaceId, name, eventType, operator, value, points, status
ScoreHistory — id, workspaceId, leadId, delta, reason, sourceEventType, createdAt
```

**API endpoints**
```
GET    /api/v1/scoring/rules
POST   /api/v1/scoring/rules
PATCH  /api/v1/scoring/rules/:id
DELETE /api/v1/scoring/rules/:id
GET    /api/v1/leads/:id/score-history
```

---

### 3.2 Segmentation

| Status | Item |
|--------|------|
| ?? | Segment model — in schema; `segments.routes.ts` stub exists |
| ?? | Segment CRUD — routes stub; no service layer |
| ?? | Dynamic segment rule evaluator |
| ?? | Static segment member management |
| ?? | Segment preview (count before saving) |
| ?? | Segment refresh on lead update / score change / event |
| ?? | `segment.entered` / `segment.exited` events |
| ?? | Saved filter reuse in campaigns |
| ?? | Behavior-based and score-based segment rules |
| ?? | Frontend segment list page — replace static placeholder |
| ?? | Frontend segment builder UI |

**Backend files to create/refactor**
- `backend/src/modules/segments/dto/`
- `backend/src/modules/segments/repositories/`
- `backend/src/modules/segments/services/segment.service.ts`
- `backend/src/modules/segments/services/segment-evaluator.service.ts`
- `backend/src/modules/segments/controllers/`

**Frontend files to create/refactor**
- `app/(app)/segments/page.tsx` — list
- `app/(app)/segments/[id]/page.tsx` — rule builder, member list

**API endpoints**
```
POST   /api/v1/segments
GET    /api/v1/segments
GET    /api/v1/segments/:id
PATCH  /api/v1/segments/:id
DELETE /api/v1/segments/:id
POST   /api/v1/segments/preview
GET    /api/v1/segments/:id/leads
```

---

### 3.3 Webhooks

| Status | Item |
|--------|------|
| ?? | Webhook endpoint model — create, update, delete, list |
| ?? | Webhook delivery model — per event delivery record |
| ?? | Webhook worker — BullMQ job to deliver to customer endpoint |
| ?? | Payload signing — HMAC signature on each delivery |
| ?? | Retry with exponential backoff |
| ?? | Dead-letter queue for permanent failures |
| ?? | Retry delivery endpoint |
| ?? | Delivery history listing |
| ?? | Frontend webhooks management page |
| ?? | Frontend delivery history page |

**Database additions needed**
```
WebhookEndpoint — id, workspaceId, url, secret, eventTypesJson, status
WebhookDelivery — id, workspaceId, webhookEndpointId, eventType, payloadJson, status, attemptCount
```

**API endpoints**
```
POST   /api/v1/webhooks
GET    /api/v1/webhooks
GET    /api/v1/webhooks/:id
PATCH  /api/v1/webhooks/:id
DELETE /api/v1/webhooks/:id
GET    /api/v1/webhooks/:id/deliveries
POST   /api/v1/webhooks/:id/retry
```

---

### 3.4 Notifications

| Status | Item |
|--------|------|
| ?? | Notification model |
| ?? | In-app notification listing and mark-read |
| ?? | Email notification delivery |
| ?? | Sales alert — notify assigned user when lead becomes SQL |
| ?? | Notification preferences per user |
| ?? | Frontend notification bell / drawer |

**Database additions needed**
```
Notification — id, workspaceId, userId, type, message, readAt, createdAt
```

**API endpoints**
```
GET    /api/v1/notifications
PATCH  /api/v1/notifications/:id/read
PATCH  /api/v1/notifications/read-all
GET    /api/v1/notifications/preferences
PATCH  /api/v1/notifications/preferences
```

---

## Phase 4 — Visibility: Analytics · Billing · RBAC Hardening · Audit Logs

> **Goal**: Teams can see full-funnel performance, the platform enforces plan limits, and all sensitive actions are tracked.

---

### 4.1 Analytics Dashboard

| Status | Item |
|--------|------|
| ?? | Analytics router — `analytics.routes.ts` stub exists; no implementation |
| ?? | Overview stats — leads, MQLs, SQLs, customers |
| ?? | Lead source breakdown |
| ?? | Campaign performance stats |
| ?? | Email open/click rate trends |
| ?? | Workflow execution stats |
| ?? | Score distribution chart |
| ?? | Attribution model data |
| ?? | Date range filtering |
| ?? | Analytics aggregation jobs (BullMQ worker) |
| ?? | Frontend analytics dashboard — replace static placeholder |
| ?? | Recharts / Chart.js integration |

**API endpoints**
```
GET    /api/v1/analytics/overview
GET    /api/v1/analytics/leads
GET    /api/v1/analytics/email
GET    /api/v1/analytics/campaigns
GET    /api/v1/analytics/workflows
GET    /api/v1/analytics/sources
GET    /api/v1/analytics/scoring
GET    /api/v1/analytics/attribution
```

---

### 4.2 Billing and Usage Control

| Status | Item |
|--------|------|
| ?? | Billing plan model |
| ?? | Subscription model per workspace |
| ?? | Usage metering — API requests, emails, leads, AI calls |
| ?? | Plan limit enforcement — block or warn on threshold |
| ?? | Stripe or billing provider integration |
| ?? | Upgrade/downgrade flow |
| ?? | Frontend billing page |
| ?? | Frontend usage meter widgets |

**Database additions needed**
```
BillingPlan  — id, name, priceMonthly, leadLimit, emailLimit, apiRequestLimit, aiRequestLimit
Subscription — id, workspaceId, billingPlanId, status, renewAt, externalCustomerId
```

---

### 4.3 RBAC Hardening and Audit Logs

| Status | Item |
|--------|------|
| ?? | RBAC roles defined in schema |
| ?? | `AuditLog` model exists; not consistently written |
| ?? | Workspace middleware enforces role on every protected route |
| ?? | Role-based endpoint guards for all roles |
| ?? | Audit log writer utility called on all sensitive actions |
| ?? | Frontend audit log viewer in workspace settings |

**API endpoints**
```
GET    /api/v1/audit-logs
```

---

## Phase 5 — AI + Advanced: AI Layer · Browser SDK · Attribution

> **Goal**: AI enhances every workflow, a browser SDK captures anonymous behavior, and attribution closes the loop from visit to revenue.

---

### 5.1 AI Feature Layer

| Status | Item |
|--------|------|
| ?? | AI assistant page exists in frontend — static placeholder |
| ?? | OpenAI / LLM provider integration |
| ?? | AI email generation — subject, body, CTA, tone |
| ?? | AI lead summary — profile, intent, next action |
| ?? | AI lead scoring prediction — conversion probability |
| ?? | AI segment builder — natural language to rules JSON |
| ?? | AI campaign insights — performance summary in plain English |
| ?? | AI prompt logging |
| ?? | Human review step before any AI output is applied |
| ?? | AI request rate limiting and workspace-level quota |
| ?? | Frontend AI assistant page — connected to real API |

**Database additions needed**
```
AIPromptLog — id, workspaceId, userId, featureType, promptText, modelName, inputJson, outputJson, status
```

**API endpoints**
```
POST   /api/v1/ai/email-generate
POST   /api/v1/ai/lead-summary
POST   /api/v1/ai/lead-score
POST   /api/v1/ai/segment-builder
POST   /api/v1/ai/campaign-insights
```

---

### 5.2 Browser SDK and Event Ingestion

| Status | Item |
|--------|------|
| ?? | Browser SDK — anonymous ID, session tracking, UTM capture |
| ?? | `POST /api/v1/events` — public key authenticated ingestion |
| ?? | `POST /api/v1/identify` — link anonymous ID to lead |
| ?? | Allowed domain validation for public keys |
| ?? | Event deduplication |
| ?? | Anonymous profile model |
| ?? | Historical activity backfill on identify |
| ?? | SDK installation guide (script tag, npm, WordPress) |
| ?? | Frontend integrations page — show SDK setup and test connection |

**Database additions needed**
```
AnonymousProfile — id, workspaceId, anonymousId, attributionJson, lastSeenAt
CustomerEvent    — id, workspaceId, profileId, leadId, eventType, propertiesJson, sessionId, createdAt
```

**API endpoints**
```
POST   /api/v1/events
POST   /api/v1/identify
```

---

### 5.3 Attribution Engine

| Status | Item |
|--------|------|
| ?? | Customer journey recording (event sequence per lead) |
| ?? | Attribution models — first touch, last touch, multi-touch |
| ?? | Revenue attribution on conversion event |
| ?? | Attribution analytics endpoints |
| ?? | Frontend attribution chart in analytics dashboard |

---

## Infrastructure and Cross-Cutting Concerns

| Status | Item |
|--------|------|
| ?? | Redis + BullMQ setup — queue configuration, workers, dead-letter |
| ?? | Job system — email, workflow, webhook, analytics, AI async workers |
| ?? | Event bus — internal domain event publishing after every state change |
| ?? | Rate limiting middleware — per API key, per IP, per workspace |
| ?? | Input validation — Zod schemas on some endpoints; needs full coverage |
| ?? | Standardized response envelope — implemented in `lib/response.ts`; not applied everywhere |
| ?? | OpenAPI / Swagger documentation for all endpoints |
| ?? | Environment configs — dev, staging, production |
| ?? | Database migrations — Prisma migration files tracked in repo |
| ?? | Secrets management — no plaintext secrets in repo |
| ?? | CORS hardening — restrict to known origins in production |
| ?? | Signed webhook payloads |
| ?? | Backend unit tests — services and critical business rules |
| ?? | Backend integration tests — API endpoints end-to-end |
| ?? | Frontend component tests |
| ?? | CI pipeline — lint, typecheck, test, build |

---

## Release Phase Summary

| Phase | Focus | Key Deliverable |
|-------|-------|-----------------|
| **Phase 1** | Website + Auth + Workspace + API Keys | Users can sign up, create a workspace, and generate API keys |
| **Phase 2** | Leads + Email + Workflows | Leads captured, emails sent, automations running |
| **Phase 3** | Scoring + Segmentation + Webhooks + Notifications | Leads scored, grouped, and events delivered externally |
| **Phase 4** | Analytics + Billing + RBAC + Audit | Full-funnel visibility, plan limits enforced, actions audited |
| **Phase 5** | AI + SDK + Attribution | AI-powered content and insights, anonymous tracking, revenue attribution |

---

## Module Implementation Plan Index

| Plan | File | Status |
|------|------|--------|
| Auth and Workspace | `plans/module-1-auth-workspace-plan.md` | ?? Exists |
| API Key Management | `plans/api-key-management-plan.md` | ?? Exists |
| Lead Management | `plans/module-leads-plan.md` | ?? To create |
| Email Marketing | `plans/module-email-plan.md` | ?? To create |
| Workflow Engine | `plans/module-workflows-plan.md` | ?? To create |
| Lead Scoring | `plans/module-scoring-plan.md` | ?? To create |
| Segmentation | `plans/module-segments-plan.md` | ?? To create |
| Webhooks | `plans/module-webhooks-plan.md` | ?? To create |
| Notifications | `plans/module-notifications-plan.md` | ?? To create |
| Analytics | `plans/module-analytics-plan.md` | ?? To create |
| Billing | `plans/module-billing-plan.md` | ?? To create |
| AI Features | `plans/module-ai-plan.md` | ?? To create |
| Browser SDK + Events | `plans/module-sdk-events-plan.md` | ?? To create |
| Attribution | `plans/module-attribution-plan.md` | ?? To create |
| Public Website | `plans/module-website-plan.md` | ?? To create |
