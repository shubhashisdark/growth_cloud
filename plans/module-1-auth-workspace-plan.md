# Module 1: Authentication & Workspace Implementation Plan

## Scope
Implement Module 1 using the PRD/TRD as source of truth, covering:
- User signup
- Login and logout
- Email verification
- Password reset
- Refresh tokens
- JWT authentication
- Workspace creation
- Team invitations
- RBAC
- Session management
- Workspace isolation
- Database schema and Prisma models
- Migrations
- Backend layers
- Frontend auth pages and client integration
- Swagger/OpenAPI docs
- Unit and integration tests
- Audit logs

## Current State Summary
Exploration found the following baseline:
- Auth logic is concentrated in [`backend/src/modules/auth/auth.routes.ts`](../backend/src/modules/auth/auth.routes.ts:1) and currently mixes token generation, persistence, email token creation, and audit logging in a single route file.
- Workspace logic is concentrated in [`backend/src/modules/workspaces/workspaces.routes.ts`](../backend/src/modules/workspaces/workspaces.routes.ts:1) and currently creates members directly without invitation lifecycle or authorization checks.
- Prisma already contains most required core entities in [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma:1), including `User`, `Workspace`, `WorkspaceMember`, `WorkspaceInvitation`, `VerificationToken`, `PasswordResetToken`, `Session`, and `AuditLog`, but the schema needs hardening and alignment to the final RBAC and workspace-isolation model.
- Frontend auth pages already exist in [`app/login/page.tsx`](../app/login/page.tsx:1), [`app/signup/page.tsx`](../app/signup/page.tsx:1), and [`app/forgot-password/page.tsx`](../app/forgot-password/page.tsx:1), but they currently assume localStorage token handling and must be reworked to the final auth contract.
- Backend app composition is centralized in [`backend/src/app.ts`](../backend/src/app.ts:1), which currently mounts module routers directly and contains only a generic Zod/error handler.

## Product Decisions Required Before Implementation
These decisions must be confirmed before code generation starts:
1. Refresh token storage strategy
   - Recommended: HttpOnly secure cookie for refresh token, short-lived JWT access token returned in JSON or also set in a non-HttpOnly cookie only if the frontend requires it.
2. Invitation acceptance flow
   - Recommended: invitee receives email link, accepts the invitation, then either completes signup if the account does not exist or joins the workspace if authenticated.
3. Frontend route protection
   - Recommended: protect authenticated application routes and redirect unauthenticated users to login, with workspace-aware navigation after authentication.

## Proposed Architecture
### Backend
Refactor the backend into layered modules:
- DTOs and validation schemas
- Repository layer for Prisma access
- Service layer for business rules
- Controller layer for HTTP concerns
- Route layer for endpoint wiring
- Middleware and guards for auth and workspace RBAC
- Shared error handling and response helpers
- Swagger/OpenAPI generation
- Audit logging utility

### Frontend
Introduce an auth-aware client integration layer:
- Typed API client helpers
- React hooks for auth/session state
- TanStack Query for server state and mutations
- Auth-aware route guards or layout checks
- Updated auth pages for signup, login, verification, forgot/reset password, invitation acceptance, and logout

## File-by-File Implementation Plan

### 1. Database schema and migrations
Update [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma:1) to:
- Normalize role naming to the final RBAC set: `super_admin`, `admin`, `marketer`, `developer`, `sales`, `viewer`
- Keep invitation, verification, session, reset-token, and audit-log entities aligned with the final auth flows
- Add missing indexes and uniqueness constraints needed for lookup, revocation, and workspace isolation
- Ensure session records support rotation, revocation, and per-device tracking as defined in the TRD
- Ensure workspace-owned tables enforce workspace scoping through indexes and relation fields

Create migrations under [`backend/prisma/migrations`](../backend/prisma/migrations:1) for:
- RBAC enum alignment
- Session/token table hardening
- Invitation lifecycle constraints
- Audit log constraints and indexes

### 2. Backend module structure
Create a production-ready folder structure under [`backend/src/modules/auth`](../backend/src/modules/auth:1) and adjacent shared areas:
- `dto/`
- `repositories/`
- `services/`
- `controllers/`
- `middleware/`
- `guards/`
- `validators/`
- `utils/`
- `types/`

Add shared infrastructure under:
- [`backend/src/lib`](../backend/src/lib:1) or equivalent shared backend utility folder for JWT helpers, password hashing, token hashing, response helpers, and audit logging
- [`backend/src/middleware`](../backend/src/middleware:1) for request auth and error handling if not already present

### 3. Auth DTOs and validation
Add DTO and validation files for:
- signup
- login
- logout
- refresh token
- email verification
- forgot password
- reset password
- invitation creation
- invitation acceptance
- workspace creation
- workspace membership updates
- RBAC role changes
- session listing/revocation

Validation must enforce:
- password length and complexity
- email normalization
- workspace slug normalization
- invite role whitelist
- token format checks
- payload shape consistency

### 4. Repository layer
Implement Prisma repositories for:
- `UserRepository`
- `WorkspaceRepository`
- `WorkspaceMemberRepository`
- `WorkspaceInvitationRepository`
- `VerificationTokenRepository`
- `PasswordResetTokenRepository`
- `SessionRepository`
- `AuditLogRepository`

Repositories must provide:
- create, find, update, revoke, and list operations
- workspace-scoped queries only where required
- transactional helpers for multi-entity auth flows
- safe lookup methods for token hashes and session hashes

### 5. Service layer
Implement business services for:
- `AuthService`
- `SessionService`
- `InvitationService`
- `WorkspaceService`
- `PermissionService`
- `EmailVerificationService`
- `PasswordResetService`
- `AuditLogService`

Service responsibilities:
- hash and verify passwords
- issue and rotate JWT/access tokens
- create and revoke sessions
- manage verification and reset token lifecycle
- create workspaces and owner memberships
- create and accept invitations
- enforce RBAC by workspace and global admin scope
- log every sensitive auth and workspace mutation

### 6. Controllers, routes, and guards
Replace the monolithic route implementation in [`backend/src/modules/auth/auth.routes.ts`](../backend/src/modules/auth/auth.routes.ts:1) with controller-driven endpoints for:
- signup
- login
- logout
- refresh
- verify email
- forgot password
- reset password
- get current session
- list sessions
- revoke session
- accept invitation
- resend verification

Refactor [`backend/src/modules/workspaces/workspaces.routes.ts`](../backend/src/modules/workspaces/workspaces.routes.ts:1) to:
- create workspace only through authenticated flow
- protect member and invitation endpoints with guards
- enforce workspace-scoped RBAC for mutations
- support inviting users, listing invitations, and accepting invitations

Add guards and middleware for:
- JWT authentication
- refresh-session validation
- workspace membership lookup
- RBAC authorization by role
- workspace isolation on every protected request
- request-context injection for current user, workspace, and session

### 7. Error handling and response contracts
Standardize backend response format across auth and workspace flows in [`backend/src/app.ts`](../backend/src/app.ts:1) and shared helpers:
- validation errors
- unauthorized errors
- forbidden errors
- not found errors
- conflict errors
- token expired errors
- invitation expired or revoked errors
- workspace isolation violations
- generic server errors

Ensure responses remain consistent and machine-readable for the frontend hooks.

### 8. Swagger/OpenAPI documentation
Add OpenAPI spec generation for auth and workspace endpoints:
- request/response examples
- auth header and cookie requirements
- role-based access notes
- invitation lifecycle descriptions
- session and refresh semantics

Publish the docs from the backend app entrypoint and keep schema names synchronized with DTOs.

### 9. Audit logs
Implement audit logging for:
- signup
- login
- logout
- token refresh
- email verification
- password reset
- workspace creation
- invitation creation, acceptance, revocation
- role changes
- session revocation

Persist logs in [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma:1) `AuditLog` and expose repository/service wrappers.

### 10. Frontend auth pages and routing
Refactor frontend auth pages under:
- [`app/login/page.tsx`](../app/login/page.tsx:1)
- [`app/signup/page.tsx`](../app/signup/page.tsx:1)
- [`app/forgot-password/page.tsx`](../app/forgot-password/page.tsx:1)

Add new pages for:
- email verification
- reset password
- invitation acceptance
- logout redirect handling
- workspace selection or post-login landing if required by the TRD

Update the pages to:
- stop persisting access tokens in localStorage
- call typed API mutations through TanStack Query or hook wrappers
- show field-level validation feedback
- handle auth errors and success states
- redirect after success to the workspace-aware landing route

### 11. React hooks and TanStack Query integration
Add frontend hooks under a shared client folder such as [`lib`](../lib:1) and/or [`hooks`](../hooks:1):
- `useLogin`
- `useSignup`
- `useLogout`
- `useVerifyEmail`
- `useForgotPassword`
- `useResetPassword`
- `useAcceptInvitation`
- `useSession`
- `useWorkspaceMembership`

Use TanStack Query for:
- mutation retries and invalidation
- session refetching
- workspace/invitation state synchronization
- auth cache clearing on logout

### 12. Unit tests
Add backend unit tests for:
- password hashing and verification
- JWT signing and verification
- session creation and revocation
- invitation token lifecycle
- RBAC checks
- workspace isolation enforcement
- DTO and validation failures
- audit log writes

Add frontend unit tests where the project test stack supports them for:
- auth page interaction
- hook behavior
- validation and error rendering

### 13. Integration tests
Add end-to-end style backend integration tests for:
- signup to workspace creation
- login and refresh flow
- logout and session revocation
- email verification
- forgot/reset password
- invitation acceptance
- role-based access enforcement
- workspace isolation violations

Verify against the real Prisma schema and transactional flow, not mocked-only behavior.

## Verification Strategy
Run and verify, in order:
1. Prisma generation and migration validation
2. TypeScript compile for backend and frontend
3. Backend test suite
4. Frontend test suite if configured
5. Integration tests covering auth and workspace lifecycle
6. Manual smoke checks for login, signup, verification, reset, refresh, and invitation flows

## Edge Cases To Cover
- duplicate signup with existing email
- login attempts before email verification
- expired or revoked verification tokens
- expired or reused reset tokens
- refresh token rotation reuse detection
- concurrent session revocation
- invitation acceptance after expiration or revocation
- workspace membership access after role change
- attempts to access foreign workspace data
- logout from one device without invalidating all sessions unless explicitly requested
- email delivery failures and retry-safe token generation

## Implementation Order
1. Finalize product decisions and lock the auth contract
2. Update Prisma schema and create migrations
3. Build shared backend infrastructure and repositories
4. Build auth and workspace services
5. Add controllers, routes, middleware, and guards
6. Add audit logging and error normalization
7. Wire Swagger/OpenAPI documentation
8. Refactor frontend auth pages and client hooks
9. Add unit and integration tests
10. Run verification and fix issues

## Approval Gate
This plan is ready for approval once the three product decisions are confirmed. After approval, implementation will be delegated to code mode via a tool switch; no manual mode change is needed.
