# Continuous integration

CI runs for every branch push, pull requests targeting `main`, merge-queue candidates, and manual dispatch. A merge into `main` triggers the push checks again. Changes belong on `edwakson/ScoGes_App`; `main` is updated through a validated PR.

## Required checks

- **Quality and security:** frozen-lockfile install, workflow/shell validation, changed-file formatting, ESLint, generated Next.js route types and TypeScript, CI safety tests, all Vitest tests, production build, high/critical dependency audit (runtime and development tooling), and redacted Git-history secret scanning.
- **Isolated integration and browser tests:** disposable local Supabase, every migration applied from scratch, public Auth/schema connectivity, authenticated TLS SMTP verification, local security advisors, transactional database constraints/RLS/negative authorization and audit rollback tests, isolated multi-connection administrator-removal races, and the complete Chromium suite against a production build.
- **Required validation:** succeeds only when both jobs succeed. Missing configuration, skipped/flaky browser tests, failed migrations, and cancelled dependencies cannot produce a green gate.

`main` branch protection is configured to require **Required validation** from the GitHub Actions app, an up-to-date branch, and a pull request, including for administrators. Force pushes and deletion are disabled. No additional reviewer is required (zero approvals), so the owner can merge a validated PR. Workflow YAML alone cannot enforce these restrictions; the repository settings were applied and read back through GitHub's API on 2026-10-30. Merge queues are supported through `merge_group`.

## Isolation and credentials

Ordinary CI needs no repository or production secrets. GitHub-hosted Ubuntu runners create local Docker Supabase instances. Only loopback service URLs and newly generated local publishable/secret keys are exported. Database reset is explicitly `--local`; never use this workflow to reset a hosted project.

The SMTP fixture is Mailpit with a temporary trusted CA, required STARTTLS and authentication, loopback bindings, no relay, and recipients restricted to `example.invalid`. SMTP verification does not send email. Browser tests use disposable synthetic users and exact-ID cleanup. The email lifecycle suite now reads actual captured Auth/application messages, completes confirmation/recovery/invitation links and rejects reused/expired links in FR/EN. It also verifies SMTP recipient rejection, failed-delivery state/audit and no received message. Fixture expiry is scoped to disposable records, with no global lifetime changes. These local captures complement the separately authorized hosted mailbox verification; they do not certify every recipient provider.

Hosted `.env.local` values are neither uploaded nor needed. Remote database tests retain certificate validation; plaintext database transport is allowed only with explicit local opt-in and a loopback URL.

## Diagnostics and maintenance

GitHub provides job/step logs and a required-gate summary. Seven-day artifacts contain JUnit results, dependency audit output, redacted secret-scan output, and browser counts. Raw browser reports, traces, screenshots, SMTP mailboxes, service logs, and keys are not uploaded. Browser console errors redact callback tokens and keys; generated passwords are masked.

Actions are pinned to full commit SHAs. Standalone tools are version-pinned and SHA-256 checked before execution. Maintain these pins deliberately with regression checks. Stale non-main runs are cancelled; main validation is retained.

Formatting is a ratchet over changed files (`pnpm format:changed`), excluding generated lockfiles. `pnpm format` still reports pre-existing repository formatting debt; this change does not rewrite canonical specifications or unrelated code.

Local verification: `pnpm lint`, `pnpm exec next typegen`, `pnpm typecheck`, `pnpm test:ci-tools`, `pnpm test`, `pnpm build`, and `pnpm format:changed`. Full isolated integration requires Docker and is validated on GitHub's Linux runner. Dependency/service download outages fail visibly rather than silently skipping checks.

At implementation, the audit has zero critical/high findings and two moderate `@vitest/mocker` advisories (patched in 5.0.3). The configured blocking threshold is high; moderate findings remain visible in the audit artifact and require follow-up.

## Tracker/documentation maintenance

The unit suite compares Markdown tracker rows with every UI sprint/milestone ID, status and progress value. This guards record consistency, not business-feature completion. New snapshot counts must come from an actual run; the reviewed PR #3 baseline remains 68 unit tests, 4 safety tests and 15 browser tests, while later consistency checks can increase totals. See [PROJECT_TRACKER.md](PROJECT_TRACKER.md), [validation evidence](SPRINT_0_VALIDATION.md) and [handoff](AI_HANDOFF.md).
