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

Install the matching Playwright browser before the first browser smoke test:

```bash
pnpm exec playwright install chromium
```

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm check:supabase
pnpm test:db
```

`check:supabase` checks Auth and the membership schema using the public configuration.
`test:db` requires a server-only `DATABASE_URL` and runs real PostgreSQL authorization
tests with all fixtures rolled back. See [Database testing](docs/DATABASE_TESTING.md).

Authentication setup, SMTP configuration, and browser-test requirements are described
in [Authentication lifecycle](docs/AUTHENTICATION.md).

## Sprint Boundary

This repository currently implements Sprint 0 only: platform foundation, auth scaffolding, tenant onboarding, RBAC baseline, audit baseline, UI shell, tests, CI, and documentation. Sprint 1 domain features must not be started without an explicit Sprint 1 prompt.

CI events, required checks, isolation, artifacts, and merge protection are documented in [Continuous integration](docs/CI.md).
