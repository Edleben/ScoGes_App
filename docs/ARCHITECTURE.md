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
- `audit`: audit event metadata handling.

Future domain folders should remain separate for `academics`, `people`, `billing`, `payments`, `collections`, `communications`, `reporting`, and `saas-billing`.

## Runtime Flow

Authenticated users sign in through Supabase. Dashboard routes call server-side session helpers. Users without an active membership are redirected to onboarding. Onboarding creates a tenant, settings, tenant-admin membership, role assignment, and audit event via a Supabase RPC.

All sensitive tenant actions must resolve the user and membership server-side. UI-only checks are not authorization.
