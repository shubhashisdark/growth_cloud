<!-- # sdk-usage-and-integration-plan

## Problem Statement
The codebase already exposes a backend SDK surface at `backend/src/modules/sdk/sdk.routes.ts` and a matching client package under `sdk/`. The user asked, in effect, “what are the uses of SDK here,” which requires documenting how the SDK is intended to be used, what backend capabilities it provides, and how the client package maps to those capabilities. This plan defines the SDK’s role in the product and the implementation work needed to make that role explicit and testable.

## What the SDK is for
The SDK is the public integration layer for external websites/apps to send marketing and engagement events into Growth Cloud without using the internal admin/auth APIs. It supports four primary use cases:
- `identify(email, traits)`: create or update a lead profile for a visitor/contact
- `track(event, properties)`: send a custom behavioral event
- `leadSync(leadData)`: synchronize a lead record from an external system or CRM
- `submitForm(formId, data)`: capture a form submission and trigger downstream automation

On the backend, these calls are exposed as `POST /api/v1/sdk/identify`, `/track`, `/lead-sync`, and `/form`. Each request is authenticated with a public API key and is scoped to a workspace.

## Current architecture notes
- Backend SDK routes live in `backend/src/modules/sdk/sdk.routes.ts` and are mounted in `backend/src/app.ts` at `/api/v1/sdk`.
- The backend validates SDK calls via `requirePublicKey`, which accepts `X-GrowthCloud-Public-Key` or `Authorization: Bearer ...`.
- SDK actions can create or update leads, insert audit log records for tracked events, trigger workflows, and dispatch webhooks.
- The client package lives in `sdk/src/client.ts`, `sdk/src/index.ts`, and `sdk/src/browser.ts`.
- Existing tests already exercise SDK behavior indirectly in `backend/src/test-all-features.ts` and unit tests in `sdk/src/index.test.ts`.

## Implementation Approach
1. Document SDK intent and usage clearly in a dedicated plan and follow-up notes so future work can reference a single source of truth.
2. Validate the backend route behavior against the client package API surface so the names, payloads, and error handling remain aligned.
3. Capture the SDK’s integration points: lead upsert, event tracking, workflow triggering, webhook dispatch, and form capture.
4. Identify gaps or inconsistencies between the SDK client and backend (for example, the client includes `autoCaptureForms` logic in `sdk/src/client.ts`, while backend support is centered on explicit `submitForm` calls).
5. Expand or add tests if needed to keep the SDK contract stable.

## File-Level Changes
### Likely to modify
- `.cora/plans/sdk-usage-and-integration-plan.plan.md` — source-of-truth plan document
- `backend/src/modules/sdk/sdk.routes.ts` — if any contract clarification or bug fix is required
- `sdk/src/client.ts` — if client/server payload alignment needs adjustments
- `sdk/src/index.ts` and `sdk/src/browser.ts` — if public exports or browser integration need clarification
- `backend/src/modules/sdk/*.test.ts` and `sdk/src/*.test.ts` — add or update tests for SDK contract coverage

### Likely to inspect only
- `backend/src/app.ts`
- `backend/src/test-all-features.ts`
- `backend/src/modules/api-keys/api-keys.routes.ts`
- `backend/src/modules/auth/auth.routes.ts`

## Edge Cases and Error Handling
- Missing public API key should return a 401 with a clear error code.
- Invalid, inactive, expired, or deleted public keys should be rejected.
- Invalid payloads should fail validation with consistent Zod error responses.
- `identify` should not overwrite existing lead fields with empty values unless explicitly provided.
- `leadSync` must support both the flat payload format and the legacy nested `lead` format.
- SDK-triggered workflow/webhook calls should not block the HTTP response if downstream dispatch fails.
- Event tracking should still audit the request even if workflow/webhook dispatch is asynchronous.

## Testing Strategy
- Add or expand backend route tests for each SDK endpoint and for public-key authentication.
- Add client-side tests for request payload formation and validation guards.
- Validate the end-to-end SDK contract using the existing `backend/src/test-all-features.ts` flow or an equivalent integration test.
- Verify that successful calls return the expected `data` shape and that failures use consistent error codes.

## Risks and Tradeoffs
- The SDK relies on asynchronous fire-and-forget workflow/webhook dispatch, which can hide downstream failures if not observed elsewhere.
- Public API keys are high-value integration credentials; error messages should remain specific enough for integrators without leaking sensitive data.
- The SDK client and backend route contracts must remain tightly aligned; changes in one side can break external integrations.
- The browser auto-capture helper in `sdk/src/client.ts` may imply behavior beyond what the backend explicitly documents, so it should be called out clearly if retained.

## Open Questions / Notes for Review
- Whether the SDK should be documented as a public integration surface in product docs or only in code comments.
- Whether `autoCaptureForms` should be part of the official SDK contract or treated as an internal convenience.
- Whether additional route-level tests should be added before changing any SDK behavior.

## Definition of Done for this planning phase
- The SDK’s purpose and supported use cases are clearly documented.
- Backend and client package responsibilities are mapped.
- Risks, edge cases, and test coverage requirements are identified.
- The plan is specific enough for implementation without further clarification. -->
