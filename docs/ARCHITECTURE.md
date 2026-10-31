# Architecture

## Scope

Sprint 0 implements the foundation of the EDXSTORE school management SaaS. It does not implement students, billing, payments, receipts, collections, reporting exports, or SaaS subscription checkout.

## Application Architecture

- Framework: Next.js 16 App Router.
- Language: TypeScript strict mode.
- Package manager: pnpm.
- UI: Tailwind CSS v4 with local accessible primitives and shadcn-compatible styling conventions.
- Auth and database: Supabase Auth and PostgreSQL.
- Validation: Zod.
- Testing: Vitest and Playwright.
- Delivery: GitHub Actions CI.

The product is a modular monolith. Domain code is separated under `src/modules`, shared infrastructure under `src/lib`, and routes under `src/app`.

## Domain Boundaries

Sprint 0 includes active implementation for:

- `identity`: auth actions, invitations, permission helpers.
- `tenants`: onboarding and tenant settings validation.
- `administration`: permission-checked member role/status and settings orchestration, validation and safe FR/EN responses.
- `audit`: metadata handling and transactional database events.
- `project-tracker`: manual milestones and reviewed evidence, checked against the Markdown tracker.

Future domain folders should remain separate for `academics`, `people`, `billing`, `payments`, `collections`, `communications`, `reporting`, and `saas-billing`.

## Runtime Flow

Authenticated users sign in through Supabase. Dashboard routes call server-side session helpers. Users without an active membership are redirected to onboarding. Onboarding creates a tenant, settings, tenant-admin membership, role assignment, and audit event via a Supabase RPC.

All sensitive tenant actions must resolve the user and membership server-side. UI-only checks are not authorization.

Authentication lifecycle routes and the session-refresh proxy are documented in
[Authentication lifecycle](AUTHENTICATION.md). Invitation email uses an `EmailProvider`
interface with a bounded, TLS-required SMTP adapter under `src/lib/email`. SMTP calls
run outside database transactions; invitation issuance and acceptance use narrow RPCs.

## Administration and status boundaries

Administrative writes resolve the active owned membership server-side, then call narrow RPCs that recheck database permissions and tenant ownership. Tenant locks serialize authorization changes and invitation acceptance; monotonic revisions reject stale writes and audit insertion is atomic with each mutation. See [Administration](ADMINISTRATION.md).

The tracker is engineering status data, not tenant financial analytics or runtime observability. `tracker-data.ts` powers the UI; a unit invariant compares it with [PROJECT_TRACKER.md](PROJECT_TRACKER.md). The [shared handoff](AI_HANDOFF.md) maps modules and verification steps for all coding agents.

## Foundation language handling

The existing `?locale=fr|en` convention is shared across foundation pages. The proxy overwrites a presentation-only locale header; the root layout uses it for `<html lang>` and the client locale context used by safe errors. Invalid/missing locale defaults to French. Locale helpers preserve unrelated query values when composing internal links; language-switch controls intentionally reload the current pathname so cached layouts and document language agree. Login, onboarding, invitation acceptance and logout retain the selected language. This header never controls authentication or tenant authorization. Public/404 pages receive locale without introducing Auth refresh calls. Root layout now renders per request.
