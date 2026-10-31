# EDXSTORE School Management SaaS

French-first Sprint 0 foundation for a secure multi-tenant school-management and school-fee collection SaaS. Foundation journeys support French and English, including onboarding, administration, navigation and safe errors; real email lifecycle acceptance remains open.

## Local Setup

1. Install dependencies:

```bash
pnpm install --frozen-lockfile
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
pnpm exec next typegen
pnpm typecheck
pnpm test:ci-tools
pnpm test
pnpm format:changed
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

This repository currently implements Sprint 0 only: platform foundation, authentication lifecycle, audited tenant onboarding, role/membership/settings administration, tenant-safe RBAC/RLS, UI shell, tests, CI, and documentation. Sprint 1 domain features must not be started without an explicit Sprint 1 prompt.

CI events, required checks, isolation, artifacts, and merge protection are documented in [Continuous integration](docs/CI.md).

Sprint 0 membership/settings controls and the reviewed migration deployment step are documented in [Administration](docs/ADMINISTRATION.md).

## Sprint 0 validation status

Foundation and administration checks are recorded in [Sprint 0 validation](docs/SPRINT_0_VALIDATION.md). Sprint 0 remains in progress: full UI translation and end-to-end email-link/receipt verification are still pending. The tracker reflects these acceptance gaps; Sprint 1 is not started.

## Project records and agent handoff

Use the [documentation map](docs/README.md), [Markdown tracker](docs/PROJECT_TRACKER.md), and [shared handoff for Claude, Codex and Antigravity](docs/AI_HANDOFF.md). The UI tracker at `/dashboard/project` shows the same manually maintained milestones and a dated evidence checkpoint. Main is PR-only; ongoing work uses `edwakson/ScoGes_App`.
