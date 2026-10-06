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
