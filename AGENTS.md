# AGENTS.md — EDXSTORE School Management SaaS

> Permanent repository instructions for Codex, Antigravity, Claude Code, Cursor, Copilot, and other AI-assisted coding agents working on this project.

---

## 1. Project Identity

This repository contains a proprietary **multi-tenant SaaS school management and school-fee collection platform** owned by **EDXSTORE LLC**.

The product is designed primarily for:

- schools and school groups;
- school administrators;
- finance teams and cashiers;
- registrars/school administration teams;
- parents and guardians;
- auditors and authorized support personnel.

The product is a **B2B2C SaaS**. Its initial business focus is reliable school billing, collections, payments, reconciliation, family communication, reporting, auditability, and tenant administration.

The MVP is **not** intended to become a full ERP, LMS, payroll system, or advanced academic-management suite in one release.

---

## 2. Permanent Product Principles

Every implementation must preserve these principles:

1. **Multi-tenant by design**
2. **Secure by default**
3. **Financially auditable**
4. **Mobile-first where appropriate**
5. **French-first and i18n-ready**
6. **Modular and maintainable**
7. **Scalable without premature distributed-system complexity**
8. **Accessible to non-technical school personnel**
9. **Provider-portable through adapters**
10. **Incremental delivery through testable vertical slices**
11. **No hidden regressions**
12. **No fabricated production behavior**

---

## 3. Required Project Documents

Before making architectural, database, security, authorization, billing, payment, or significant feature changes, inspect the relevant project documents.

Recommended repository structure:

```text
/
├── AGENTS.md
├── README.md
├── docs/
│   ├── product/
│   │   └── Cahier_des_charges_SaaS_Gestion_Scolarite_V2_EDXSTORE.docx
│   ├── engineering/
│   │   └── STABLE_FRAMEWORK.md
│   └── prompts/
│       └── SPRINT_0_MASTER_PROMPT.md
├── ai-rules/
│   └── STABLE_AI_CODING_SKILL.md
└── ...
```

If file names differ, locate the equivalent document instead of assuming it is missing.

### Source roles

- **Cahier des charges / Product Specification**  
  Defines **what the product is and what the business requires**.

- **Active Sprint Master Prompt**  
  Defines **what must be implemented in the current execution**.

- **STABLE Framework**  
  Defines **how engineering decisions should be made**.

- **STABLE AI Coding Skill**  
  Defines **how the AI coding agent must analyze, implement, verify, and report work**.

- **AGENTS.md**  
  Defines the **permanent repository-wide operating rules and non-negotiable safeguards**.

---

## 4. Instruction Precedence and Conflict Handling

Use this precedence model:

1. **Safety, data integrity, tenant isolation, and explicit repository non-negotiables in this file**
2. **Explicit current task / active Sprint Prompt**
3. **Product specification**
4. **STABLE engineering framework**
5. **Existing documented architecture and ADRs**
6. **Current implementation patterns in the repository**

A current task may narrow scope or add requirements.

A current task must **not silently weaken**:

- tenant isolation;
- authentication;
- authorization;
- financial integrity;
- auditability;
- data protection;
- migration safety;
- secrets handling.

If two authoritative instructions genuinely conflict:

1. identify the conflict;
2. preserve the safer existing behavior;
3. explain the conflict clearly;
4. do not make a destructive or security-reducing assumption.

Do not invent missing business rules.

---

# 5. STABLE Is the Mandatory Engineering Method

Apply the STABLE framework to all implementation, debugging, refactoring, review, migration, integration, and production-readiness work.

## S — Surgical & SOLID

Make the **smallest correct change** that solves the requested problem.

Rules:

- do not rewrite unrelated working code;
- preserve existing public behavior unless explicitly changed;
- keep responsibilities focused;
- avoid god components, god services, god controllers, and giant utility files;
- prefer readable code over clever code;
- apply SOLID where it provides concrete maintainability or testability value;
- avoid abstractions that exist only for hypothetical future needs.

## T — Testable & Traceable

Every meaningful change must be verifiable.

Rules:

- define acceptance criteria;
- preserve or improve type safety;
- validate external inputs;
- add or update appropriate tests;
- include observable error handling for critical flows;
- make important behavior traceable through code, logs, audit events, metrics, or documentation;
- never claim a check passed unless it actually ran.

## A — Architecture-Aligned & Available

Put code in the correct architectural layer and make important flows dependable.

Rules:

- respect domain/module boundaries;
- separate UI, application logic, business/domain logic, data access, and infrastructure concerns;
- degrade safely when dependencies fail;
- use retry, timeout, fallback, queue, or idempotency only where justified;
- do not make a non-critical third-party outage collapse the whole product.

## B — Balanced for Bottlenecks

Be performance-aware without premature over-engineering.

Consider where relevant:

- pagination;
- indexing;
- caching;
- batching;
- async/background jobs;
- file size limits;
- rate limiting;
- N+1 queries;
- expensive loops;
- repeated external calls;
- import/export volume;
- transaction throughput.

Do not introduce distributed-system complexity without a measurable requirement.

## L — Low-Regression & Loosely Coupled

Protect existing behavior and keep dependencies explicit.

Especially protect:

- login and authentication;
- tenant resolution;
- RBAC and permissions;
- database migrations;
- payment flows;
- financial records;
- SaaS billing;
- audit events;
- imports and exports;
- API contracts;
- webhooks;
- notifications;
- administrative workflows;
- parent portal flows.

Prefer backward-compatible changes and explicit migration paths.

## E — Expandable & Elastic

Prepare clean extension points without building imaginary features.

Rules:

- prefer configuration over hardcoding;
- isolate third-party providers;
- keep domain boundaries clear;
- keep application layers stateless where practical;
- externalize environment-specific configuration;
- prepare for additional roles, tenants, plans, providers, regions, and modules only where the product roadmap already indicates likely need.

---

# 6. Mandatory Development Workflow

For every non-trivial task:

## Step 1 — Inspect

Before editing:

- inspect the repository;
- inspect relevant documentation;
- inspect relevant tests;
- inspect database migrations if data changes are involved;
- understand existing conventions before introducing new ones.

Never assume the repository is empty.

## Step 2 — Understand

State internally or in the implementation report:

- goal;
- expected behavior;
- affected modules;
- constraints;
- what must not break;
- acceptance criteria.

## Step 3 — Assess Risk

Check whether the change affects:

- tenant isolation;
- authentication;
- authorization;
- personal data;
- finance;
- payments;
- SaaS billing;
- database schema;
- migrations;
- imports/exports;
- third-party integrations;
- public APIs;
- webhooks;
- CI/CD;
- deployment configuration.

## Step 4 — Plan

Choose the smallest safe implementation.

Do not perform large rewrites merely because a different architecture might also work.

## Step 5 — Implement

Implement in small coherent batches.

Keep business logic out of presentation components.

Avoid unnecessary dependencies.

## Step 6 — Verify

Run the checks appropriate to the task.

At minimum for significant implementation work, attempt:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run E2E tests when the affected flow requires them:

```bash
pnpm test:e2e
```

If a command cannot run because of missing external configuration, report that explicitly.

Do not fake success.

## Step 7 — Report

For complex tasks, finish with:

```text
STABLE Analysis
- Goal
- Affected Areas
- Risks
- Plan

Implementation Summary
- Changed
- Preserved
- Why this approach

Verification
- Checks run
- Results
- Manual checks
- Regression areas reviewed

Remaining Notes
- Risks
- Blockers
- Follow-ups
```

A smaller task may use a shorter report.

---

# 7. Target Technical Architecture

Unless an approved architecture decision changes it, use:

- **Next.js 16 App Router**
- **React**
- **TypeScript — `strict: true`**
- **pnpm**
- **Tailwind CSS**
- **shadcn/ui**
- **Zod**
- **PostgreSQL**
- **Supabase**
- **Supabase Auth**
- **PostgreSQL Row Level Security**
- **Vitest**
- **Testing Library**
- **Playwright**
- **GitHub Actions**
- observability compatible with **Sentry and/or OpenTelemetry**

The default architecture is a **modular monolith**.

Do not introduce by default:

- generalized microservices;
- Kubernetes;
- Kafka;
- GraphQL;
- event sourcing;
- CQRS;
- unnecessary message brokers;
- unnecessary infrastructure layers.

Such technologies require a concrete, documented need.

---

# 8. Domain Boundaries

Keep explicit domain boundaries similar to:

```text
tenants
identity
academics
people
billing
payments
collections
communications
reporting
audit
saas-billing
```

Possible repository shape:

```text
src/
  app/
  components/
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

tests/
  e2e/

docs/
```

Do not force this exact structure if the repository already has a sound equivalent structure.

The important requirement is **clear domain ownership and separation of concerns**.

---

# 9. Multi-Tenancy — Critical Non-Negotiable

Tenant isolation is a critical security boundary.

Every sensitive tenant-owned business record must be attributable to a tenant.

Never trust a client-supplied:

- `tenant_id`;
- organization ID;
- membership ID;
- role;
- permission;
- financial status;
- protected ownership identifier.

Resolve tenant context server-side from the authenticated principal and valid membership.

## Required controls

Use defense in depth:

1. authenticated user/session;
2. membership validation;
3. server-side permission authorization;
4. tenant-scoped queries;
5. PostgreSQL RLS where appropriate;
6. database constraints;
7. negative authorization tests.

A user from Tenant A must never be able to read, modify, export, enumerate, or infer protected Tenant B data.

Tenant isolation must cover:

- pages;
- server actions;
- route handlers/APIs;
- database queries;
- exports;
- files/storage;
- background jobs;
- audit views;
- reports;
- notifications.

Add negative tests whenever tenant-sensitive logic changes.

---

# 10. Authentication and Authorization

Authentication and authorization are separate concerns.

Use authentication to establish identity.

Use authorization to determine whether the authenticated identity may perform an action.

Authorization must always be enforced **server-side**.

Never treat any of these as authorization:

- hidden buttons;
- disabled UI;
- client-side route guards alone;
- client-side role checks alone.

Prefer reusable server-side helpers such as:

```text
requireUser()
requireMembership()
requireTenant()
requirePermission()
```

or the equivalent established project pattern.

## Role model

Expected role concepts include:

- platform/super admin;
- tenant administrator;
- finance manager/econome;
- cashier;
- registrar/school administration;
- parent/guardian;
- optional student;
- auditor/authorized support.

Roles are default permission profiles.

Effective access must be permission-aware and tenant-aware.

Sensitive support access must be restricted and auditable.

---

# 11. Database and Migration Rules

PostgreSQL is the system of record.

## Required practices

- use proper primary keys;
- use foreign keys intentionally;
- define unique constraints;
- add indexes based on real query needs;
- use transactions for multi-step consistency;
- validate invariants at the database level where appropriate;
- use timestamps consistently;
- use `tenant_id` on tenant-scoped critical records;
- document non-obvious constraints.

## Migration safety

Migrations are **append-only**.

Never:

- reset a real existing database;
- drop production data casually;
- rewrite migration history after it has been applied;
- use destructive schema changes without a migration/rollback plan.

For risky schema changes:

- preserve backward compatibility where practical;
- separate expand and contract phases when appropriate;
- provide migration notes;
- identify rollback limitations.

Seed data must be clearly development/test-only.

---

# 12. Financial Integrity Rules

This application manages school-related financial information.

Financial correctness is a first-class requirement.

## Monetary values

Never use binary floating-point values as the financial source of truth.

Use:

- PostgreSQL `NUMERIC` / `DECIMAL`; or
- integer minor units where appropriate for the currency model.

Currency handling must be explicit.

Do not assume every currency has the same decimal behavior.

## Financial records

Once validated/postable financial transactions are recorded, they must not be silently mutated or deleted.

Corrections must normally use linked records such as:

- reversal;
- refund;
- adjustment;
- credit;
- compensating transaction.

The original transaction history must remain traceable.

## Derived balances

Displayed balances and totals must be derivable from authoritative:

- charge/invoice lines;
- allocations;
- payment transactions;
- reversals/refunds.

Avoid manually editable balance fields that can drift away from the ledger/source records.

## Payments

Payment processing must eventually support:

- provider abstraction;
- unique provider references;
- signed webhook verification;
- idempotent webhook handling;
- safe retries;
- reconciliation;
- partial payments;
- allocation;
- refunds/reversals;
- receipt generation;
- audit events.

Never create duplicate financial transactions from replayed webhooks.

---

# 13. Separate School Payments from SaaS Billing

There are two distinct financial domains:

### A. School financial activity

Money paid by parents/guardians toward school fees.

### B. SaaS subscription billing

Money paid by schools to use the EDXSTORE SaaS platform.

These domains must remain structurally and logically separate.

Do not mix:

- invoices;
- transactions;
- accounting records;
- payment-provider metadata;
- reporting;
- permissions;
- webhook handling.

Shared infrastructure may be reused where technically appropriate, but domain records and business logic remain separate.

---

# 14. External Provider Abstraction

Do not tightly couple business logic to a single provider.

Use explicit interfaces/adapters for future or current integrations such as:

```text
PaymentGateway
EmailProvider
SmsProvider
StorageProvider
JobScheduler
```

Provider examples may include payment processors, mobile-money providers, email services, SMS services, cloud storage, and queue/job platforms.

Provider-specific SDK code belongs in infrastructure/adapters, not in core domain logic.

A missing production credential is **not permission to invent one**.

Use mocks/test adapters where appropriate.

---

# 15. Input Validation and API Safety

Validate all external input server-side.

Use Zod or the established equivalent for:

- forms;
- route handlers;
- server actions;
- webhook payloads;
- query parameters;
- imports;
- configuration.

Never trust client-controlled values for:

- amount;
- payment status;
- invoice status;
- role;
- permission;
- tenant ownership;
- user ownership;
- protected IDs.

Use safe database APIs / parameterized queries.

Return user-safe errors.

Do not expose stack traces, secrets, auth tokens, or private infrastructure details to users.

---

# 16. Secrets and Configuration

Never commit:

- API keys;
- service-role keys;
- database passwords;
- production credentials;
- private tokens;
- encryption keys.

Use environment variables and secret stores.

Maintain a safe:

```text
.env.example
```

with variable names and setup instructions only.

Do not put real secrets in:

- source code;
- screenshots;
- fixtures;
- logs;
- documentation;
- error messages;
- test output committed to Git.

---

# 17. Logging, Audit, and Observability

Technical logs and business audit logs are different.

## Technical observability

Use structured logs where useful.

Include correlation/request IDs for critical flows when practical.

Never log:

- passwords;
- tokens;
- session cookies;
- full secrets;
- unnecessary personal data;
- raw sensitive provider payloads.

## Business audit

Critical business actions should be append-only and auditable.

Examples include:

- authentication-sensitive events;
- tenant creation;
- user invitations;
- role/permission changes;
- financial configuration changes;
- invoice/finalized fee actions;
- payments;
- reconciliation;
- reversals/refunds;
- exports;
- sensitive support actions.

Audit metadata must be safe and intentional.

---

# 18. Imports and Exports

Imports are potentially destructive and must be controlled.

Expected import behavior:

- preview/dry-run;
- validation;
- duplicate handling;
- useful row-level errors;
- partial-failure policy;
- clear result summary;
- idempotency where appropriate.

Large imports/exports should move to asynchronous/background processing when justified.

Exports must:

- respect tenant boundaries;
- respect permissions;
- avoid leaking data from other tenants;
- use secure private file handling;
- use expiring access where applicable.

---

# 19. UX / UI Requirements

The product must be professional, modern, clean, responsive, and suitable for non-technical users.

## Responsive intent

- **Parent/guardian portal:** mobile-first.
- **Finance/admin workflows:** desktop-efficient while remaining responsive.

## Language

French is the initial primary interface language.

Architecture must remain i18n-ready for English and future languages.

Do not scatter hard-coded UI strings when the project has an i18n convention.

## Accessibility

Target WCAG 2.2 AA intent where practical.

Require:

- keyboard navigation;
- visible focus states;
- appropriate form labels;
- semantic controls;
- accessible dialogs;
- understandable validation errors;
- adequate contrast;
- no critical status represented by color alone.

## UI states

Relevant screens and actions must handle:

- loading;
- empty;
- error;
- permission denied;
- timeout/dependency failure;
- disabled/submitting states.

Do not display fabricated business or financial metrics.

---

# 20. Testing Requirements

Testing depth must match business risk.

## Unit tests

Use for:

- calculations;
- permissions;
- status transitions;
- allocations;
- validation;
- business rules;
- deterministic domain logic.

## Database/integration tests

Use for:

- constraints;
- transactions;
- RLS;
- tenant isolation;
- migration behavior;
- repositories;
- payment reconciliation logic.

## Adapter/contract tests

Use for:

- payment gateways;
- webhooks;
- email;
- SMS;
- storage;
- background jobs.

## E2E tests

Prioritize critical journeys such as:

```text
login
→ onboarding
→ tenant access
→ student/guardian setup
→ billing
→ payment
→ receipt
→ reporting
```

Only include steps implemented in the current product phase.

## Security tests

Include negative tests for:

- tenant crossover;
- missing permission;
- forged protected IDs;
- duplicate webhooks;
- unsafe uploads;
- sensitive endpoints.

## Regression rule

A feature is not considered complete merely because the happy path works.

---

# 21. CI/CD Expectations

CI should normally verify:

- lockfile install;
- lint;
- typecheck;
- unit/integration tests;
- production build;
- other appropriate security/dependency checks.

Ordinary CI should not require production secrets.

Use separate environments:

- local;
- preview;
- staging;
- production.

Keep their credentials and data separated.

Production deployment should use controlled approval appropriate to the project maturity.

Risky features should support staged rollout or feature flags where useful.

---

# 22. Documentation Rules

Keep project documentation aligned with actual code.

Important documents may include:

```text
docs/ARCHITECTURE.md
docs/SECURITY.md
docs/DATA_MODEL.md
docs/DECISIONS.md
docs/IMPLEMENTATION_LOG.md
```

Update the relevant document when an implementation materially changes:

- architecture;
- schema;
- authorization;
- payment behavior;
- critical configuration;
- deployment behavior;
- security assumptions.

Do not write documentation that claims functionality exists when it does not.

Important design decisions should be recorded as concise ADRs or equivalent decision notes where useful.

---

# 23. Current Sprint Scope

The active sprint is controlled by the current sprint prompt in:

```text
docs/prompts/
```

At project initialization, the expected active file is:

```text
docs/prompts/SPRINT_0_MASTER_PROMPT.md
```

The active sprint prompt defines the implementation scope for that session.

**Do not automatically continue into the next sprint.**

When the active sprint reaches its Definition of Done:

1. stop;
2. report results;
3. identify blockers;
4. recommend the next sprint prompt;
5. wait for explicit instruction before implementing the next sprint.

When Sprint 1, Sprint 2, etc. become active, replace or clearly identify the active prompt while retaining historical sprint prompts if useful for traceability.

---

# 24. Product Roadmap Boundaries

The project roadmap currently follows this broad sequence:

```text
Sprint 0 — Foundations
Sprint 1 — Academic references + students + guardians + enrollments + imports
Sprint 2 — Fees + billing + installments
Sprint 3 — Payments + reconciliation + receipts
Sprint 4 — Collections + reminders + communications
Sprint 5 — Reporting + administration + fine-grained permissions
Hardening & UAT
Pilot Go-Live
```

Do not build later sprint functionality merely because an extension point exists.

Prepare interfaces when necessary, but avoid speculative production implementations.

---

# 25. AI Features

AI is post-MVP unless explicitly activated by a current sprint.

Potential future uses include:

- assisted reminder drafting;
- payment/reconciliation anomaly detection;
- cash-flow trend assistance;
- authorized conversational reporting.

AI must not autonomously make consequential financial collection decisions without human control.

Minimize personal data shared with AI providers.

Tenant boundaries and permissions also apply to AI retrieval/context.

Sensitive AI use should be auditable where appropriate.

---

# 26. Dependencies

Before adding a dependency:

1. verify the requirement cannot be solved cleanly with the existing stack;
2. explain why the dependency is justified;
3. prefer maintained and widely adopted packages;
4. avoid overlapping libraries that solve the same problem;
5. consider security and bundle/runtime impact.

Do not change package managers.

Use `pnpm`.

---

# 27. Code Quality Guardrails

Do not:

- use `any` without a documented reason;
- suppress TypeScript errors casually;
- disable lint rules to hide defects;
- use giant untyped JSON blobs for core domain data;
- duplicate authorization logic across components;
- put provider SDK calls throughout domain code;
- hardcode tenant IDs;
- hardcode production URLs or secrets;
- silently catch critical errors;
- add fake success states;
- implement placeholder financial calculations as if they were final;
- remove working features without explicit instruction.

Prefer:

- explicit types;
- focused modules;
- predictable naming;
- pure domain functions where appropriate;
- composable server utilities;
- safe transaction boundaries;
- clear failure handling.

---

# 28. Destructive Actions

Do not perform destructive operations without explicit authorization.

This includes:

- deleting a production/staging database;
- resetting migrations;
- mass deleting tenant data;
- rewriting Git history;
- rotating or revoking production credentials;
- destroying cloud resources;
- force-pushing shared branches;
- dropping populated columns/tables without a migration plan.

When destructive work is genuinely required, explain impact and rollback/recovery strategy first.

---

# 29. Definition of Done

A feature or sprint is done only when applicable requirements are satisfied.

Check:

- implementation matches requested scope;
- tenant isolation is preserved;
- authorization is enforced server-side;
- validation is present;
- data integrity is preserved;
- errors are handled;
- tests are added or updated;
- relevant checks pass;
- UI states are covered;
- documentation is updated;
- no unrelated regression is known;
- no fabricated integration is presented as working;
- remaining blockers are clearly disclosed.

For financial/security-critical features, test depth must be higher than for cosmetic UI work.

---

# 30. Permanent AI Agent Guardrails

The coding agent must not:

- build the whole SaaS in one pass;
- rewrite the whole repository for a small request;
- alter unrelated files without reason;
- bypass RLS or server-side authorization for convenience;
- trust client-side tenant or role data;
- create unsafe financial mutations;
- merge school-payment logic with SaaS-subscription billing;
- introduce unnecessary infrastructure;
- invent credentials;
- expose secrets;
- silently weaken security;
- hide uncertainty;
- claim tests passed when they did not run;
- continue into an unrequested sprint.

The coding agent should:

- inspect first;
- preserve working code;
- implement surgically;
- favor KISS and YAGNI;
- apply DRY only where duplication is harmful;
- keep modules loosely coupled;
- use adapters for third-party providers;
- add tests proportional to risk;
- document meaningful architectural decisions;
- explain unresolved blockers honestly;
- leave the codebase cleaner or at least no worse.

---

# 31. End-of-Task Reporting Template

For substantial work, use:

```text
## STABLE Analysis

Goal:
Affected areas:
Main risks:
Implementation plan:

## Implementation Summary

Changed:
Preserved:
Architecture decisions:

## Database / Migrations

Migrations:
Constraints/indexes:
Data migration notes:

## Security Review

Tenant isolation:
Authorization:
Input validation:
Secrets/logging:
Financial integrity:

## Verification

pnpm lint:
pnpm typecheck:
pnpm test:
pnpm test:e2e:
pnpm build:

Manual checks:

## Files Changed

- ...

## Remaining Notes

Blockers:
Risks:
Technical debt:
Recommended next step:
```

Do not report a command as successful unless it actually succeeded.

---

# 32. One-Line Project Rule

> Build the smallest secure, testable, tenant-safe, financially auditable change that satisfies the active sprint without breaking the existing system or over-engineering the future.

---

**Owner:** EDXSTORE LLC  
**Repository policy:** Permanent project-level AI coding instructions  
**Engineering framework:** STABLE  
**Delivery model:** Incremental vertical slices with explicit sprint boundaries
