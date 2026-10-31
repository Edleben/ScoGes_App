# Sprint 1 — Academic references, students, guardians, enrollments and imports

Status: **Proposed; inactive; foundation closure review pending.** Prepared 2026-10-30. This document is an approval-ready scope, not evidence of owner approval or authorization to begin implementation. Sprint 0 remains active.

## Authority and activation

Read [AGENTS.md](../../AGENTS.md), the [product specification](../product/PRODUCT_SPEC.md), [STABLE framework](../engineering/STABLE_FRAMEWORK.md), [coding skill](../../ai-rules/STABLE_AI_CODING_SKILL.md), [shared handoff](../AI_HANDOFF.md), and existing architecture, security, data model and tests before editing code.

Product basis: sections 7.3–7.6, 7.22–7.23 and the Sprint 1 roadmap. The available `.docx.md` is a source-availability notice, not additional requirements. Consult the available product PDF for relevant detail; identify conflicts instead of inventing rules.

Implementation may begin only after the [foundation completion gate](../SPRINT_0_COMPLETION_GATE.md) is evidenced as passed and the owner explicitly approves activation of this prompt. Record the approval and reviewed commit in the handoff; update the documentation index to identify the active prompt. Retain the Sprint 0 prompt as history. A passing build alone does not activate Sprint 1.

## Goal and limits

Deliver a tenant-safe administrative journey: configure an academic year and academic references, create a student and linked guardians, enroll the student, then import equivalent validated records. Every new flow must work in French and English with consistent locale navigation, accessible controls, and loading, empty, validation, permission, dependency-error and submitting states.

Use the existing modular monolith and established server authorization, validation, database, audit and UI patterns. Work only on `edwakson/ScoGes_App`; main changes through reviewed PRs with required validation. Do not deploy or apply hosted migrations merely because this prompt exists.

## Decisions required before the affected slice

Produce a short decision sheet citing existing product requirements. Request owner decisions only where those sources do not settle the rule; record accepted answers before implementation:

- Student required fields, school identifier/matricule assignment, uniqueness scope, and edit/archive semantics. Do not infer identity from name alone.
- Academic hierarchy and optional program/level/class relationships, year boundaries and overlapping-year policy. Terms and subjects appear in the broader specification but are excluded from this bounded slice unless the owner explicitly adds them.
- Enrollment statuses and allowed transitions, duplicate enrollment policy, transfers and historical correction rules. Do not silently overwrite history.
- Guardian required fields, relationship metadata, duplicate matching, consent/notification preference defaults and archive/unlink behavior. A shared phone or email is not automatic authority to merge people or grant account access.
- Explicit permission matrix for academic, student, guardian, enrollment and import operations, including read-only access. Existing foundation permissions do not authorize these new operations. No implicit grants to finance, cashiers, auditors or support.
- CSV/XLSX templates, supported encoding/date formats, required reference identifiers, file/row/cell/time limits, duplicate policy, atomic versus partial commit, retry/idempotency scope and retention. Numerical limits must be approved and tested, not invented as business requirements.

Unresolved decisions block their affected implementation; continue only independent approved work. Do not treat proposed defaults as accepted rules.

## Four delivery slices

### 1. Academic references

Create, view, edit and safely archive academic years, programs, levels and classes using the approved hierarchy. Validate dates and references; preserve references used by existing enrollments. Provide paginated/searchable lists where appropriate. Do not cascade-delete history. Deliver schema, constraints, RLS, application authorization, FR/EN UI and tests together.

### 2. Students and guardians

Provide authorized student creation, editing, archiving, search, filtering and detail views with linked guardians and enrollment history. Implement many-to-many student/guardian relationships, with approved relationship metadata, guardian name, email, phone, preferred language, notification preferences and account-access status semantics. Minimize personal data. Do not present unavailable billing information or fabricate balances.

Guardian records do not automatically create Supabase users, invitations or parent portal access. Parent portal authentication, consent workflows and communication delivery require separate approved scope. Prevent cross-tenant record linking, including forged student/guardian IDs.

### 3. Enrollments

Connect student, academic year, approved program/level/class references and enrollment status. Enforce approved uniqueness and transition rules in the database and application. Preserve historical enrollments; reject stale conflicting writes. Test concurrent duplicate creation and invalid or archived reference selection.

### 4. CSV/XLSX imports

Support students, guardians, their links and enrollments using approved templates and existing academic references. Do not import fees or automatically create unresolved reference values.

Separate parse/validate/preview from commit. Preview shows normalized values, duplicate classification, row-level errors and a result summary without business writes. Treat files and cells as untrusted: validate size/type/content and decompressed workbook limits; reject unsupported encrypted/macro-enabled content; never execute formulas or external links. Keep parsing behind an adapter. Any parser dependency needs documented justification and security review.

On commit, revalidate identity, active membership, permissions, tenant scope, references and changed data; do not trust the preview or client-supplied IDs. Bind preview/commit state to its actor and tenant. Enforce the approved transaction/partial-failure policy, duplicate handling, replay/idempotency and bounded processing. Test expired or tampered previews, permission revocation, concurrent commits and safe retries. Report actual committed/rejected counts; never claim full success after partial failure. Do not add queues or distributed infrastructure without evidence that approved limits require them.

## Invariants and architecture

- Keep academics and people domain ownership explicit; keep business rules and provider/file parsing out of presentation components.
- Resolve tenant context server-side from authenticated active membership. Enforce explicit permissions in server operations and database policies/RPCs; never use privileged keys to bypass application authorization.
- Scope all sensitive records and queries to the tenant. Use tenant-aware foreign keys/constraints so references cannot cross tenants even if application checks fail. Cover list, detail, search, links, imports and audit access with negative tests.
- Add append-only migrations only. Test the complete migration chain in disposable CI and compatibility with existing foundation data. Document rollout and rollback limits; never rewrite applied history or reset hosted databases.
- Audit critical creates, edits, archives, links, enrollment changes and import commits with safe actor/tenant attribution. Mutation and required audit insert must commit together; test rollback on audit failure. Avoid raw files, unnecessary personal data, secrets or tokens in logs/audit metadata.
- Preserve login, onboarding, tenant switching, invitations, role/status administration, last-admin safeguards, stale-write protection and financial-domain separation.

## Explicit exclusions

No fees, invoices, installments, balances, payments, receipts, reconciliation, collection reminders, SaaS billing, reporting/export suite, LMS, grades, attendance, payroll, AI, student portal or parent portal. No bulk destructive data repair, hosted deployment, identity-provider replacement or broad UI rewrite. No automatic continuation into Sprint 2.

## Acceptance and verification

For each small coherent PR, state acceptance criteria and run focused tests plus the appropriate repository checks. Before sprint completion, run `pnpm lint`, `pnpm exec next typegen`, `pnpm typecheck`, `pnpm test:ci-tools`, `pnpm test`, `pnpm format:changed`, `pnpm build`, database tests and `pnpm test:e2e`. Record commands, environment, commit, CI links and actual outcomes; disclose skips and blockers.

Required evidence:

- Unit tests cover approved validation, identifiers, status transitions, permission matrix, duplicate detection and import normalization.
- Database tests cover tenant isolation for every new table/relationship, constraints, unauthorized writes, concurrent duplicates, history preservation and transactional audit failure.
- Authenticated browser journeys cover references → student → multiple guardians → enrollment → preview → commit in both languages, with persisted data checked against the expected tenant.
- Negative journeys cover other-tenant IDs and search results, missing permission, inactive membership, invalid/oversized/malformed files, duplicate/replayed imports, stale previews and dependency failures. Failed preview/commit must not leave unintended records or leak data.
- Existing foundation regression suites remain green without skipped/flaky results counted as passes. Ordinary CI uses disposable services, not production secrets.
- Review keyboard operation, labels, focus, mobile layout, safe errors and locale-preserving navigation. No fabricated dashboard metrics.
- Update architecture, schema, security, decisions, implementation log, shared handoff and both trackers with executed evidence. Keep the typed/Markdown tracker invariant passing; do not mark an unverified milestone done.

Stop after the approved Sprint 1 Definition of Done is evidenced. Report remaining risks and seek explicit instruction before starting Sprint 2.
