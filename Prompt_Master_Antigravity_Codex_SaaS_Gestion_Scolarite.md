# MASTER BUILD PROMPT — SaaS de gestion de scolarité (Sprint 0 + Fondations)

You are a senior SaaS architect and principal full-stack engineer. Build the foundation of a production-grade, multi-tenant school-fee management SaaS for EDXSTORE LLC.

## 1) Source of truth
Use the attached/available specification **“Cahier des charges — SaaS de gestion de scolarité V2”** as the product source of truth.

Do **not** attempt to build the entire product in one pass. This execution is limited to **Sprint 0 + core foundations**. The goal is to create a secure, scalable, clean baseline that future prompts can extend without rewrites.

If the workspace already contains code, inspect it first and preserve working functionality. Do not overwrite an existing architecture without a concrete reason.

## 2) Product goal
Create the technical foundation for a B2B2C SaaS that lets schools manage:
- institutions/tenants and users;
- students, guardians and enrollments;
- school fees, invoices, installments and collections;
- online/offline payments and reconciliation;
- reminders and communications;
- parent portal;
- reporting and audit.

Only the **foundation** is to be implemented now. Financial modules beyond scaffolding come in later sprints.

## 3) Mandatory architecture
Use a **modular monolith** with explicit domain boundaries. Do not introduce microservices, Kubernetes, Kafka, GraphQL, event sourcing, or other infrastructure unless a concrete current requirement makes it necessary.

Recommended stack:
- Next.js 16 App Router
- React
- TypeScript with `strict: true`
- pnpm
- Tailwind CSS
- shadcn/ui
- Zod for validation
- PostgreSQL managed through Supabase
- Supabase Auth
- Supabase Storage-ready abstraction
- PostgreSQL Row Level Security as defense in depth
- Vitest + Testing Library
- Playwright for E2E
- GitHub Actions for CI
- Sentry/OpenTelemetry-ready observability hooks

Keep provider integrations abstract so the code remains portable.

## 4) Non-negotiable engineering rules
1. TypeScript strict; avoid `any` unless explicitly justified.
2. Never trust `tenant_id`, role, permission, amount, status, or other security-sensitive values coming from the client.
3. Every tenant-scoped action must resolve the authenticated user, membership, tenant and permission server-side.
4. Create database constraints, foreign keys and indexes intentionally.
5. Use RLS/default-deny where appropriate; service-role access must be isolated to trusted server jobs/admin operations.
6. No real secrets in source control, docs, logs or generated examples. Provide `.env.example` only.
7. All external input must be validated server-side with Zod or equivalent schemas.
8. Migrations are append-only. Never reset or destroy an existing database unless explicitly instructed.
9. Do not use floating-point numbers for financial values. Financial modules later must use `NUMERIC/DECIMAL` or integer minor units according to currency rules.
10. Critical actions must be audit-ready.
11. UI must be mobile-first, accessible and responsive.
12. Every feature must include loading, empty, error and permission-denied states when relevant.
13. Do not fabricate working third-party integrations. If credentials are missing, scaffold the adapter and document setup.
14. Do not introduce fake production data. Development seed data must be clearly isolated.
15. At the end of each implementation batch run lint, typecheck, tests and production build; fix regressions before stopping.

## 5) Repository structure
Prefer a clean structure similar to:

```text
src/
  app/
    (public)/
    (auth)/
    (dashboard)/
    api/
  components/
    ui/
    shared/
  modules/
    tenants/
    identity/
    academics/
    people/
    billing/
    payments/
    collections/
    communications/
    reporting/
    audit/
    saas-billing/
  lib/
    auth/
    db/
    permissions/
    validation/
    observability/
    utils/
  types/
supabase/
  migrations/
  seed.sql
tests/
  e2e/
docs/
```

The exact tree may differ if there is already a sound project convention, but keep domain boundaries explicit.

## 6) Sprint 0 implementation scope
Implement the following in order.

### A. Workspace and quality foundation
- Initialize or normalize the Next.js app.
- Configure pnpm and lockfile.
- Enable strict TypeScript.
- Configure ESLint and formatting.
- Configure Tailwind and shadcn/ui.
- Add path aliases.
- Add `.env.example` with documented variables only.
- Add scripts for `dev`, `lint`, `typecheck`, `test`, `test:e2e`, `build`.

### B. Architecture documentation
Create:
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/DATA_MODEL.md`
- `docs/DECISIONS.md`
- `docs/IMPLEMENTATION_LOG.md`

Keep them concise, factual and synchronized with actual code.

### C. Initial database model
Create migrations for the minimum foundation entities:
- `tenants`
- `tenant_settings`
- `profiles`
- `memberships`
- `roles`
- `permissions`
- `role_permissions`
- `membership_roles` or equivalent normalized mapping
- `invitations`
- `audit_events`

Recommended common fields where relevant:
- UUID primary keys
- `tenant_id`
- `created_at`
- `updated_at`
- `created_by`
- status/archive fields only where justified

Add appropriate indexes and unique constraints.

Do **not** create the full financial schema yet. You may add module placeholders/types, but not speculative production tables.

### D. Multi-tenancy and authorization
Implement:
- membership-based tenant resolution;
- reusable `requireUser()` / `requireMembership()` / `requirePermission()` server helpers or equivalent;
- tenant-aware server data access;
- RLS policies for the foundation tables;
- explicit platform-super-admin concept separated from tenant roles;
- negative authorization tests proving Tenant A cannot access Tenant B data.

Never derive authorization only from hidden UI controls.

### E. Authentication
Implement with Supabase Auth:
- sign in;
- sign out;
- password reset/request flow if straightforward;
- protected dashboard routes;
- authenticated server session utilities;
- invitation acceptance-ready flow.

If external Supabase credentials are unavailable, make the project compile and provide exact setup instructions without inventing credentials.

### F. Tenant onboarding vertical slice
Implement a minimal end-to-end onboarding flow:
1. authenticated user has no tenant;
2. user creates an institution;
3. institution stores name, slug, country, base currency, timezone and default locale;
4. creator becomes tenant admin;
5. user lands on the protected tenant dashboard.

Validation must happen server-side. Slugs must be normalized and unique.

### G. App shell and design system
Create a sleek professional SaaS shell:
- responsive sidebar/drawer;
- top navigation;
- tenant switcher placeholder designed for future multi-membership;
- user menu;
- breadcrumbs;
- light/dark-ready tokens;
- accessible forms, dialogs, tables, toasts and skeletons.

Create these initial routes/screens:
- `/`
- `/login`
- `/onboarding`
- `/dashboard`
- `/dashboard/settings`
- `/dashboard/users`

The dashboard should show only foundation-level summary cards/placeholders, not fabricated financial analytics.

### H. User and membership administration
Implement basic tenant admin capabilities:
- list members;
- invite a member by email;
- assign a predefined tenant role;
- deactivate/revoke membership where safe;
- enforce permissions server-side.

Email delivery may be mocked/logged in development if no provider is configured, but the invitation model and token handling must be production-oriented.

### I. Audit baseline
Record audit events for at least:
- tenant creation;
- tenant settings changes;
- member invitation;
- role assignment/change;
- membership deactivation.

Audit events should store actor, tenant, action, target metadata, timestamp and correlation/request metadata when available. Do not log secrets or sensitive raw payloads.

### J. Testing baseline
Add tests for:
- Zod schemas;
- permission helpers;
- tenant isolation;
- tenant creation;
- invite/role authorization;
- one Playwright smoke flow: login/setup stub or test auth → onboarding → dashboard.

Use stable test fixtures and keep tests deterministic.

### K. CI
Create GitHub Actions workflow that runs:
- install from lockfile;
- lint;
- typecheck;
- unit/integration tests;
- production build.

Do not require production secrets for ordinary CI validation.

## 7) Security baseline
Use OWASP ASVS 5.0 principles proportionate to this MVP.

At minimum:
- secure cookies/session practices through the auth provider;
- server-side authorization;
- input validation;
- safe database queries;
- CSRF protection where relevant to chosen patterns;
- security headers/CSP strategy documented;
- rate-limit abstraction for sensitive public endpoints;
- upload restrictions documented for future storage;
- secrets hygiene;
- auditability;
- no PII or auth tokens in logs.

## 8) UX requirements
- French-first UI architecture, but make strings i18n-ready.
- Mobile-first parent-facing patterns and desktop-efficient admin patterns.
- Use clean spacing, restrained visual hierarchy and a modern B2B SaaS aesthetic.
- Meet WCAG 2.2 AA intent where practical.
- Keyboard navigation and visible focus states are required.
- Never communicate critical state by color alone.

## 9) What NOT to build in this execution
Do not implement yet:
- full student/guardian CRUD;
- complete academic-year/class module;
- invoices/fees;
- payment gateway integration;
- real mobile money;
- receipts;
- dunning/reminders;
- reporting/exports;
- SaaS subscription checkout;
- ERP integration;
- native mobile app;
- AI features.

Only create interfaces/placeholders where needed to preserve architecture boundaries.

## 10) Required implementation process
Before changing files:
1. inspect the workspace;
2. summarize what exists;
3. identify conflicts with this prompt;
4. present a short implementation plan;
5. then execute the changes.

While coding:
- make small coherent changes;
- preserve working code;
- prefer composition over duplication;
- avoid unnecessary dependencies;
- keep business logic out of React UI components;
- add comments only where the reason is not obvious from code.

## 11) Definition of Done for this run
This run is complete only when:
- the app installs cleanly with pnpm;
- lint passes;
- typecheck passes;
- unit/integration tests pass;
- production build passes;
- core auth/tenant foundation is implemented or clearly blocked only by missing external credentials;
- tenant isolation is covered by tests;
- onboarding vertical slice is implemented;
- permissions are enforced server-side;
- audit baseline exists;
- CI workflow exists;
- docs reflect actual architecture;
- `.env.example` and setup steps are complete.

## 12) Final response format
At completion, return:
1. short architecture summary;
2. exact files/folders created or materially changed;
3. database migrations created;
4. implemented routes;
5. tests added and results;
6. commands executed and their status;
7. required environment variables;
8. unresolved blockers, if any;
9. security notes;
10. recommended next prompt for **Sprint 1: Academic configuration + Students/Guardians/Enrollments + Import**.

Stop after Sprint 0. Do not continue automatically into Sprint 1.
