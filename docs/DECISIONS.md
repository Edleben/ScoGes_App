# Decisions

## ADR-0001: Modular Monolith

Decision: use a Next.js modular monolith for MVP delivery.

Reason: the product needs secure tenant-aware vertical slices without premature distributed-system complexity.

## ADR-0002: Supabase Auth and PostgreSQL RLS

Decision: use Supabase Auth, PostgreSQL tables, and RLS as defense in depth.

Reason: this matches the project specification and provides strong tenant isolation primitives.

## ADR-0003: Sprint 0 RPCs for Critical Writes

Decision: tenant onboarding and invitation creation use narrow RPC functions.

Reason: each flow must be transactional and auditable. The RPCs verify `auth.uid()` and keep tenant creation, membership assignment, and audit writes consistent.

## ADR-0004: No Financial Tables in Sprint 0

Decision: do not create billing or payment tables yet.

Reason: Sprint 0 is limited to platform foundations. Financial records require deeper domain design and tests in later sprints.

## ADR-0005: Authentication Lifecycle and SMTP Boundary

Decision: retain Supabase Auth for signup, password recovery, PKCE exchange and
session refresh; use a per-request Next.js proxy for refresh-cookie propagation.
Resolve identity and permissions again in server actions and database RPCs.

Invitation acceptance is a transactional RPC bound to a verified recipient email.
Store only token digests; return tokens once to the authorized issuance action and
send fragment links through an `EmailProvider` SMTP adapter. A tenant-preference
cookie is revalidated against the user's active membership before use.

Nodemailer supplies SMTP transport missing from the existing stack; it is isolated
under infrastructure, requires TLS and uses bounded timeouts. No new email vendor,
queue, service-role application access or later-sprint domain is introduced.

## ADR-0006: Isolated required CI validation

Decision: run push, PR and merge-queue checks with an aggregate required gate, read-only GitHub permissions, disposable local Supabase and TLS SMTP fixtures, and no production secrets. Require successful validation and a PR before updating main.

Checks cover application code, migration order, tenant isolation and browser authentication. Upload only safe reports; keep auth traces and raw reports private to the disposable runner. Formatting applies to changed files to avoid unrelated canonical-document rewrites.

Minimum security versions: Next.js/eslint-config-next 16.4.1 and Zod 4.6.6. Targeted pnpm overrides patch vulnerable transitive Vite, Undici and source-map-js versions; remove them when upstream resolutions are safe. These are security maintenance within Sprint 0, not a new product feature.
