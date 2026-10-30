# Continuous integration

CI runs for every branch push, pull requests targeting `main`, merge-queue candidates, and manual dispatch. A merge into `main` triggers the push checks again. Changes belong on `edwakson/ScoGes_App`; `main` is updated through a validated PR.

## Required checks

- **Quality and security:** frozen-lockfile install, workflow/shell validation, changed-file formatting, ESLint, generated Next.js route types and TypeScript, CI safety tests, all Vitest tests, production build, high/critical dependency audit (runtime and development tooling), and redacted Git-history secret scanning.
- **Isolated integration and browser tests:** disposable local Supabase, every migration applied from scratch, public Auth/schema connectivity, authenticated TLS SMTP verification, transactional database constraints/RLS/negative authorization tests, and the complete Chromium suite against a production build.
- **Required validation:** succeeds only when both jobs succeed. Missing configuration, skipped/flaky browser tests, failed migrations, and cancelled dependencies cannot produce a green gate.

Configure `main` branch protection to require **Required validation**, an up-to-date branch, and a pull request, including for administrators. Workflow YAML alone cannot enforce merge restrictions. Merge queues are supported through `merge_group`.

## Isolation and credentials

Ordinary CI needs no repository or production secrets. GitHub-hosted Ubuntu runners create local Docker Supabase instances. Only loopback service URLs and newly generated local publishable/secret keys are exported. Database reset is explicitly `--local`; never use this workflow to reset a hosted project.

The SMTP fixture is Mailpit with a temporary trusted CA, required STARTTLS and authentication, loopback bindings, no relay, and recipients restricted to `example.invalid`. SMTP verification does not send email. Browser tests use disposable synthetic users and exact-ID cleanup. Existing tests cover authentication, password changes and invitation acceptance; they do not establish real inbox delivery or every email-confirmation/recovery journey.

Hosted `.env.local` values are neither uploaded nor needed. Remote database tests retain certificate validation; plaintext database transport is allowed only with explicit local opt-in and a loopback URL.

## Diagnostics and maintenance

GitHub provides job/step logs and a required-gate summary. Seven-day artifacts contain JUnit results, dependency audit output, redacted secret-scan output, and browser counts. Raw browser reports, traces, screenshots, SMTP mailboxes, service logs, and keys are not uploaded. Browser console errors redact callback tokens and keys; generated passwords are masked.

Actions are pinned to full commit SHAs. Standalone tools are version-pinned and SHA-256 checked before execution. Maintain these pins deliberately with regression checks. Stale non-main runs are cancelled; main validation is retained.

Formatting is a ratchet over changed files (`pnpm format:changed`), excluding generated lockfiles. `pnpm format` still reports pre-existing repository formatting debt; this change does not rewrite canonical specifications or unrelated code.

Local verification: `pnpm lint`, `pnpm exec next typegen`, `pnpm typecheck`, `pnpm test:ci-tools`, `pnpm test`, `pnpm build`, and `pnpm format:changed`. Full isolated integration requires Docker and is validated on GitHub's Linux runner. Dependency/service download outages fail visibly rather than silently skipping checks.

At implementation, the audit has zero critical/high findings and two moderate `@vitest/mocker` advisories (patched in 5.0.3). The configured blocking threshold is high; moderate findings remain visible in the audit artifact and require follow-up.
