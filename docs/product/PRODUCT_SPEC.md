# PRODUCT_SPEC.md — EDXSTORE School Management SaaS

> Product specification for the proprietary multi-tenant school management SaaS owned by EDXSTORE LLC.

## 1. Product Overview

Working name: **EDXSTORE School Management SaaS**

The application is a **multi-tenant B2B2C SaaS platform** for educational institutions to manage:

- students;
- parents/guardians;
- school enrollment;
- school fees;
- billing and installment plans;
- payment tracking;
- online and offline payments;
- reconciliation;
- receipts;
- collections and reminders;
- reporting;
- administration;
- auditability;
- SaaS subscription management.

The product must be secure, auditable, scalable, mobile-friendly, and usable by non-technical school personnel.

## 2. Business Objectives

The application must help schools:

1. reduce school-fee collection delays;
2. improve payment visibility;
3. reduce manual reconciliation;
4. provide families with clear account information;
5. improve financial traceability;
6. automate reminders;
7. generate receipts and account statements;
8. improve financial reporting;
9. reduce administrative workload;
10. support secure multi-school SaaS operations;
11. provide reliable audit logs;
12. support future integrations.

## 3. Target Users

### Platform Users
- Platform Administrator / Super Admin
- Authorized Platform Support

### Institution Users
- Tenant Administrator
- Finance Manager / Bursar / Accountant
- Cashier
- Registrar / School Administration
- Auditor

### Family Users
- Parent / Guardian
- Student, if enabled later

## 4. Multi-Tenant SaaS Model

Each institution is a separate tenant.

Examples:

```text
School A → Tenant A
School B → Tenant B
School Group C → Tenant C
```

A user from Tenant A must never be able to access protected Tenant B data unless a specific, authorized, auditable platform-support mechanism explicitly allows it.

Tenant isolation applies to:

- database queries;
- pages;
- APIs;
- server actions;
- exports;
- reports;
- files;
- background jobs;
- notifications;
- audit logs;
- integrations.

Tenant context must be resolved on the server.

Never trust a browser-supplied `tenant_id` as sufficient authorization.

## 5. Mandatory Language Requirements

The application must be fully available in:

- **English**
- **French**

Both languages are first-class product requirements.

This is mandatory and must not be treated as a future enhancement.

### 5.1 Language Coverage

The application must support English and French for:

- authentication pages;
- navigation;
- dashboard;
- tenant onboarding;
- user administration;
- student management;
- guardian management;
- academic configuration;
- billing;
- payments;
- reconciliation;
- receipts;
- reports;
- parent portal;
- validation messages;
- system messages;
- notifications;
- email templates;
- SMS templates where applicable;
- help text;
- error messages.

### 5.2 Language Selection

Each tenant must be able to configure a default language:

```text
en
fr
```

Users should be able to override the tenant default where permitted.

Recommended resolution order:

```text
User preference
→ Tenant default
→ Platform fallback
```

### 5.3 Internationalization Architecture

Do not hard-code user-facing text throughout the application.

Use a centralized i18n system with stable translation keys.

Example:

```text
auth.login.title
students.form.firstName
billing.invoice.status.paid
payments.receipt.download
collections.reminder.overdue
```

Every new user-facing feature must provide both English and French translations before it is considered complete.

### 5.4 Locale-Sensitive Formatting

The application must format:

- dates;
- numbers;
- currencies;
- percentages;
- decimal separators;
- thousands separators;

according to locale.

Example:

```text
English:
September 16, 2026
1,250.00

French:
16 septembre 2026
1 250,00
```

Do not assume language and currency are the same thing.

## 6. Tenant Configuration

Tenant configuration should support:

- institution name;
- institution slug;
- country;
- base currency;
- timezone;
- default language;
- supported payment methods;
- contact information;
- branding settings where applicable.

The architecture must not assume one country or one currency.

## 7. Core MVP Scope

### 7.1 Tenant Onboarding

Initial flow:

```text
Authenticated user
→ Create institution
→ Create tenant settings
→ Assign tenant administrator role
→ Create audit event
→ Redirect to protected dashboard
```

Required data should include:

- institution name;
- slug;
- country;
- currency;
- timezone;
- default language.

### 7.2 User and Membership Management

Tenant administrators must be able to:

- list members;
- invite members;
- assign roles;
- update permitted roles;
- deactivate memberships;
- revoke access;
- resend invitations where applicable.

Authorization must be server-side.

### 7.3 Academic Configuration

Support:

- academic year;
- term/trimester/semester where applicable;
- program/track;
- level/grade;
- class/group;
- module/subject where needed;
- enrollment status.

The model should remain configurable because not all institutions use the same academic structure.

### 7.4 Student Management

Authorized users must be able to:

- create;
- edit;
- archive;
- search;
- filter;
- view enrollment;
- view linked guardians;
- view permitted billing/account information.

### 7.5 Guardian / Family Management

A guardian may be linked to multiple students.

A student may have multiple guardians.

Expected information includes:

- name;
- relationship;
- email;
- phone;
- preferred language;
- notification preferences;
- account access status.

A guardian must only see linked students.

### 7.6 Enrollment Management

Enrollment should connect:

```text
Student
→ Academic Year
→ Program / Level / Class
→ Enrollment Status
```

Enrollment history must be preserved.

### 7.7 Fee Configuration

Schools must be able to configure charges such as:

- registration;
- tuition;
- trimester fees;
- transport;
- cafeteria;
- exam fees;
- technology fees;
- uniforms;
- activities;
- other configurable charges.

Rules may vary by:

- academic year;
- program;
- level;
- class;
- student;
- category.

### 7.8 Discounts, Scholarships, Penalties, and Adjustments

Support controlled and auditable:

- discounts;
- scholarships;
- waivers;
- penalties;
- late fees;
- adjustments.

### 7.9 Billing and Invoices

Support:

- one-time billing;
- scheduled charges;
- invoices;
- invoice lines;
- due dates;
- status;
- student/family association;
- academic-year context;
- balance calculation.

Possible states:

```text
draft
issued
partially_paid
paid
overdue
cancelled
```

### 7.10 Installment Plans

Support:

- total amount;
- due dates;
- installment amounts;
- discount rules;
- penalty rules;
- status.

### 7.11 Payment Management

Support:

- online payments;
- authorized offline/manual payments.

Potential channels:

- bank card;
- bank transfer;
- mobile money;
- cash/manual payment;
- other provider integrations.

Payment integrations must use provider abstraction.

### 7.12 Mobile Money Readiness

The architecture must allow multiple mobile-money providers.

Possible examples depending on country:

- TMoney;
- Flooz;
- MTN Mobile Money;
- Orange Money;
- Wave;
- other regional providers.

Do not claim a provider is supported until its integration is implemented and verified.

### 7.13 Payment Reconciliation

Support reconciliation between:

- expected charges;
- internal payment transactions;
- external provider transactions;
- authorized manual payment records.

The system should identify:

- duplicates;
- unmatched payments;
- partial payments;
- overpayments;
- failed payments;
- reversals/refunds.

### 7.14 Payment Allocation

A payment may be allocated to:

- one invoice;
- multiple invoices;
- selected invoice lines;
- outstanding balance.

The system must prevent double allocation.

### 7.15 Receipts

Receipts should include:

- institution;
- receipt number;
- date;
- student/family;
- amount;
- currency;
- payment method;
- provider/reference;
- allocation summary;
- status.

Receipt templates must support both English and French.

### 7.16 Account Statements

Authorized users and guardians should be able to view:

- charges;
- payments;
- adjustments;
- refunds/reversals;
- current balance;
- transaction history.

### 7.17 Collections and Overdue Tracking

Support:

- overdue account list;
- aging;
- escalation status;
- collection notes;
- reminder history;
- follow-up status.

Internal notes must remain restricted.

### 7.18 Automated Reminders

Support:

- email;
- SMS;
- push notification where available.

Events may include:

- upcoming due date;
- overdue payment;
- failed payment;
- receipt confirmation;
- installment-plan event.

Duplicate uncontrolled notifications must be prevented.

### 7.19 Communication Preferences

Guardians should be able to configure supported notification preferences, including:

- preferred language;
- email;
- SMS;
- supported notification categories.

### 7.20 Reporting

Reports may include:

- total billed;
- total collected;
- outstanding balance;
- overdue amount;
- collection rate;
- payments by channel;
- payments by class;
- aged receivables;
- reconciliation exceptions.

Filters may include:

- tenant;
- academic year;
- class;
- level;
- fee type;
- payment method;
- date range;
- payment status.

### 7.21 Exports

Support:

- CSV;
- XLSX;
- PDF.

Exports must respect tenant isolation and permissions.

### 7.22 Imports

Initial import use cases:

- students;
- guardians;
- enrollments;
- possibly fee configuration.

Support:

- CSV;
- XLSX;
- validation;
- preview/dry-run;
- duplicate detection;
- row-level errors;
- result summary.

### 7.23 Audit Log

Critical actions must be append-only and auditable.

Examples:

- tenant creation;
- invitations;
- role changes;
- student updates;
- fee changes;
- invoice actions;
- payment events;
- reconciliation;
- refunds/reversals;
- exports;
- sensitive support access.

Audit entries should include:

- tenant;
- actor;
- action;
- target type;
- target ID;
- timestamp;
- safe metadata;
- request/correlation ID where applicable.

## 8. Financial Integrity Requirements

### 8.1 Monetary Representation

Never use binary floating point as the authoritative source for money.

Use:

- PostgreSQL `NUMERIC` / `DECIMAL`; or
- defined integer minor units.

Currency must always be explicit.

### 8.2 Finalized Financial Transactions

Finalized financial transactions must not be silently edited or deleted.

Use linked correction records such as:

- reversal;
- refund;
- credit;
- adjustment;
- compensating transaction.

### 8.3 Balances

Balances must be derived from authoritative financial records.

Avoid manually editable balance fields.

### 8.4 Idempotency

Payment operations and webhooks must be idempotent where required.

Replayed provider webhooks must not create duplicate financial transactions.

## 9. Separation of Financial Domains

### School-Fee Domain

Includes:

- student charges;
- invoices;
- installments;
- payments;
- allocations;
- receipts;
- refunds/reversals;
- collections.

### SaaS Subscription Domain

Includes:

- tenant subscription plan;
- subscription status;
- SaaS invoices;
- SaaS checkout;
- SaaS provider events.

These two financial domains must remain separate.

## 10. Roles and Permissions

Expected role concepts:

```text
platform_admin
tenant_admin
finance_manager
cashier
registrar
auditor
parent
student
```

Possible permissions:

```text
students.read
students.write
students.archive

guardians.read
guardians.write

billing.read
billing.write
billing.issue

payments.read
payments.record
payments.reconcile
payments.refund

reports.read
reports.export

users.read
users.invite
users.manage_roles

audit.read
```

Final naming may evolve, but authorization must remain explicit and server-side.

## 11. Security Requirements

The platform must support:

- secure authentication;
- server-side authorization;
- least privilege;
- tenant isolation;
- PostgreSQL RLS;
- encryption in transit;
- encryption at rest through infrastructure;
- secure secrets management;
- input validation;
- safe error responses;
- rate limiting for sensitive endpoints;
- audit logging;
- secure headers;
- CSRF protection where applicable;
- upload validation;
- webhook signature verification;
- backup and recovery planning.

## 12. Authentication

Use Supabase Auth unless an approved architecture decision changes the provider.

Required capabilities:

- sign in;
- sign out;
- password reset;
- protected routes;
- secure session validation;
- invitation acceptance.

Future capabilities may include:

- MFA;
- SSO;
- identity federation.

## 13. Privacy and Data Protection

The architecture must support:

- data access requests;
- correction;
- retention;
- deletion/anonymization where lawful;
- export;
- consent/preferences where applicable.

Applicable financial/legal retention requirements may override deletion for specific records.

## 14. Accessibility

Target WCAG 2.2 AA intent where practical.

Require:

- keyboard navigation;
- visible focus;
- accessible form labels;
- semantic controls;
- accessible dialogs;
- meaningful validation errors;
- adequate contrast;
- no critical status communicated only by color.

## 15. Responsive Product Strategy

### Parent Portal
Mobile-first.

### School Administration
Desktop-efficient, tablet-friendly, and responsive on mobile.

## 16. UX Requirements

The application must be:

- modern;
- clean;
- professional;
- intuitive;
- responsive;
- consistent;
- performant;
- suitable for non-technical users.

Required interface states:

- loading;
- empty;
- error;
- permission denied;
- success;
- submitting;
- dependency failure.

Do not display fabricated business or financial metrics.

## 17. Target Technical Architecture

Default stack:

```text
Next.js 16 App Router
React
TypeScript strict mode
pnpm

Tailwind CSS
shadcn/ui

Zod

PostgreSQL / Supabase
Supabase Auth
PostgreSQL RLS

Vitest
Testing Library
Playwright

GitHub Actions

Sentry and/or OpenTelemetry-ready observability
```

## 18. Architecture Style

Use a **modular monolith** for the MVP.

Expected domain boundaries:

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

Do not introduce microservices without a concrete business or scale requirement.

## 19. Provider Abstraction

Use adapters/interfaces for external providers.

Expected abstractions may include:

```text
PaymentGateway
EmailProvider
SmsProvider
StorageProvider
JobScheduler
```

Provider-specific SDK logic must not leak into core business logic.

## 20. Background Jobs

Potential background workloads:

- reminders;
- large imports;
- large exports;
- reconciliation;
- reports;
- notification delivery;
- provider retries.

Jobs must be tenant-aware, observable, and retry-safe where appropriate.

## 21. Performance and Scalability

Design for growth across:

- tenants;
- students;
- guardians;
- invoices;
- payments;
- notifications;
- reports.

Use where justified:

- pagination;
- indexing;
- caching;
- batching;
- async jobs;
- query optimization;
- rate limiting.

Avoid premature distributed-system complexity.

## 22. Availability and Resilience

Expected practices:

- automated backups;
- monitored backups;
- restoration procedure;
- dependency failure handling;
- managed database resilience;
- safe retries;
- health monitoring;
- environment separation.

Formal SLA values should be defined before production commitments.

## 23. Backup and Disaster Recovery

Before pilot production launch, define and test:

- backup schedule;
- retention policy;
- restore procedure;
- RPO;
- RTO.

Do not claim disaster-recovery capability without tested restoration procedures.

## 24. AI Capabilities

AI is post-MVP unless explicitly activated.

Potential future uses:

- assisted reminder drafting;
- anomaly detection;
- reconciliation assistance;
- cash-flow insights;
- conversational reporting.

AI must not autonomously make consequential financial or collection decisions.

Tenant boundaries and permissions also apply to AI context.

## 25. MVP Roadmap

### Sprint 0 — Platform Foundations

- repository setup;
- CI;
- architecture;
- Supabase;
- authentication;
- tenant model;
- tenant onboarding;
- membership;
- RBAC foundation;
- RLS;
- audit baseline;
- UI shell;
- bilingual i18n foundation;
- initial English/French translations;
- testing foundation.

### Sprint 1 — Academic and Student Domain

- academic years;
- programs;
- levels;
- classes;
- students;
- guardians;
- enrollments;
- CSV/XLSX imports;
- English/French UI for all new flows.

### Sprint 2 — Billing

- fee configuration;
- discounts;
- penalties;
- invoices;
- invoice lines;
- installment plans;
- statements.

### Sprint 3 — Payments

- payment abstraction;
- offline payments;
- initial online provider;
- payment allocation;
- reconciliation;
- receipts;
- refunds/reversals;
- idempotent webhooks.

### Sprint 4 — Collections and Communications

- overdue tracking;
- reminders;
- email;
- SMS;
- notification preferences;
- collection workflow.

### Sprint 5 — Reporting and Administration

- dashboards;
- reports;
- exports;
- fine-grained permissions;
- enhanced audit views;
- operational administration.

### Hardening and UAT

- security review;
- tenant-isolation verification;
- performance testing;
- accessibility review;
- bilingual content review;
- backup/restore test;
- UAT;
- bug fixing.

### Pilot Go-Live

- limited pilot tenants;
- monitoring;
- support;
- feedback;
- issue triage;
- controlled rollout.

## 26. MVP Prioritization

### Must Have

- secure authentication;
- multi-tenancy;
- tenant isolation;
- English and French UI;
- user/membership administration;
- students;
- guardians;
- enrollment;
- school fees;
- invoices;
- installment plans;
- payment tracking;
- payment recording;
- receipts;
- reconciliation baseline;
- reminders;
- reporting;
- audit;
- role/permission enforcement;
- import/export;
- backup strategy.

### Should Have

- online payment provider;
- mobile money where commercially required;
- parent portal;
- email/SMS automation;
- richer dashboards;
- API integrations;
- SSO-ready architecture;
- customizable receipt templates.

### Could Have

- push notifications;
- native mobile app;
- advanced analytics;
- AI assistance;
- advanced ERP connectors;
- predictive collections;
- cross-institution benchmarking where legally permitted.

### Won't Have in Initial MVP

Unless explicitly approved:

- full LMS;
- payroll;
- complete HR;
- complete accounting ERP;
- GPS transport tracking;
- advanced attendance platform;
- full timetable engine;
- generalized microservices architecture;
- native mobile app;
- autonomous AI financial decision-making.

## 27. Acceptance Criteria

The MVP is not ready until:

- English UI works;
- French UI works;
- language switching works where supported;
- no key MVP page contains untranslated production text;
- tenant isolation tests pass;
- server-side permissions are enforced;
- critical financial rules are tested;
- payment idempotency is validated where implemented;
- audit logging covers critical actions;
- imports are safely validated;
- exports respect permissions;
- responsive layouts are verified;
- accessibility is reviewed;
- lint passes;
- typecheck passes;
- tests pass;
- production build passes;
- backup/restore procedure is documented before pilot launch.

## 28. Product Invariants

1. A tenant must never see another tenant's protected data.
2. A guardian must never see an unrelated student's protected data.
3. Client-provided role or permission claims are not authoritative.
4. Client-provided payment amounts/statuses are not authoritative.
5. Financial transaction history must remain auditable.
6. Finalized payment records must not be silently overwritten.
7. Replayed webhooks must not generate duplicate payments.
8. School-fee finances must remain separate from SaaS subscription finances.
9. English and French must remain supported throughout the product.
10. Every new user-facing feature must include English and French translation coverage.
11. Production secrets must never be committed.
12. Later roadmap functionality must not be implemented prematurely.

## 29. Required Repository Documentation

Recommended structure:

```text
AGENTS.md
README.md

docs/
  product/
    PRODUCT_SPEC.md
    Cahier_des_charges_SaaS_Gestion_Scolarite_V2_EDXSTORE.docx

  engineering/
    STABLE_FRAMEWORK.md

  prompts/
    SPRINT_0_MASTER_PROMPT.md
    ...

ai-rules/
  STABLE_AI_CODING_SKILL.md

docs/ARCHITECTURE.md
docs/SECURITY.md
docs/DATA_MODEL.md
docs/DECISIONS.md
docs/IMPLEMENTATION_LOG.md
```

`PRODUCT_SPEC.md` is the primary machine-readable product specification for coding agents.

The DOCX remains the formal business specification.

## 30. Relationship Between Project Documents

```text
PRODUCT_SPEC.md
→ defines WHAT the product must do

AGENTS.md
→ defines permanent repository-wide coding and safety rules

STABLE_FRAMEWORK.md
→ defines HOW engineering decisions should be made

STABLE_AI_CODING_SKILL.md
→ defines HOW AI coding agents should execute tasks

SPRINT_X_MASTER_PROMPT.md
→ defines WHAT to implement NOW
```

No sprint prompt may silently override:

- tenant isolation;
- security;
- financial integrity;
- auditability;
- bilingual English/French requirements;
- data protection;
- migration safety.

## 31. Product Summary

> A secure, bilingual English/French, multi-tenant SaaS platform that helps educational institutions manage students, guardians, school billing, installment plans, payments, reconciliation, receipts, collections, communications, reporting, and auditability through a modern, scalable, mobile-friendly application.

---

**Owner:** EDXSTORE LLC  
**Product Type:** Multi-tenant B2B2C SaaS  
**Mandatory Languages:** English + French  
**Architecture:** Modular Monolith  
**Primary Database:** PostgreSQL / Supabase  
**Delivery Method:** Incremental STABLE-guided sprints
