# EDXSTORE School Management SaaS

Sprint 0 foundation for a secure, bilingual, multi-tenant school management and school-fee collection SaaS.

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy `.env.example` to `.env.local` and fill in Supabase values.

3. Run the app:

```bash
pnpm dev
```

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Sprint Boundary

This repository currently implements Sprint 0 only: platform foundation, auth scaffolding, tenant onboarding, RBAC baseline, audit baseline, UI shell, tests, CI, and documentation. Sprint 1 domain features must not be started without an explicit Sprint 1 prompt.
