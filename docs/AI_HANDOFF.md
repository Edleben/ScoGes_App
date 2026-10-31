# Shared handoff — Claude, Codex and Antigravity

Checkpoint: **2026-10-31**, bilingual foundation follow-up after merged PR #5. Historical test counts below retain their original baseline. This is a repository handoff, not permission to execute the next sprint, deploy, reset databases, or contact recipients. Recheck repository and remote state before acting; conversation history and these dated counts can become stale.

## Start here

1. Read `../AGENTS.md`, the current human request and `prompts/SPRINT_0_MASTER_PROMPT.md`. Apply their documented precedence.
2. Read the product specification under `product/`, `engineering/STABLE_FRAMEWORK.md`, and `../ai-rules/STABLE_AI_CODING_SKILL.md`. Equivalent root copies are historical/distribution entry points; compare them if they diverge rather than guessing a new authority.
3. Read `PROJECT_TRACKER.md`, `SPRINT_0_VALIDATION.md`, this handoff, and the domain documents listed in `README.md`.
4. Inspect `git status --short`, the active branch, remotes, latest commits and relevant tests. Preserve uncommitted work. Fetch remote state before making claims about PRs or deployment.
5. Present a small plan, implement within the current authorized scope, verify, and report actual results and limits. Stop at the sprint boundary.

Codex should enter through `AGENTS.md`; Claude can enter through root `CLAUDE.md`; Antigravity can enter through root `ANTIGRAVITY.md`. All three routes point to the same rules and handoff. No agent has an exemption from tenant isolation, secrets handling or the owner's branch policy.

## Current state

- Proprietary EDXSTORE LLC B2B2C school-management/fee-collection SaaS; modular Next.js/React/TypeScript monolith. French-first; foundation journeys now support French and English.
- Sprint 0 is **in progress, 83% of six unweighted milestones**: five milestones delivered, email lifecycle acceptance open. This is a manual checklist, not business analytics or a production-readiness score.
- Sprint 1 through Sprint 5 remain planned at zero. Do not start student, billing/payment, collection, reporting-export or AI implementation without explicit instruction.
- PR #1 introduced isolated CI; PR #2 completed administration; PR #3 expanded validation and safe onboarding errors. All three were verified merged. PR #3 merge commit: `92efae9454af9ece48836868c0e151c2e6db010b`.
- Functional validation baseline from PR #3: **68** unit/component/contract tests, **4** CI safety tests and **15** Chromium tests, all passing; push/PR required gates passed. The handoff adds a tracker-drift invariant test, so expect the unit total to rise; verify rather than hardcoding a new pass claim.
- Hosted development tests passed against the project configured in ignored `.env.local`; exact synthetic fixtures were cleaned up. No real email was sent by those validation runs.

## Implemented behavior and code map

| Area               | Code / behavior                                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity           | `src/modules/identity/`, `src/lib/auth/session.ts`, `src/lib/supabase/`, `src/proxy.ts`; Supabase Auth, server identity, session refresh and live membership resolution               |
| Onboarding         | `src/modules/tenants/`, `src/app/onboarding/`; authenticated tenant creation uses a transactional RPC and safe localized errors; success still redirects to dashboard                 |
| Administration     | `src/modules/administration/`, dashboard users/settings; predefined role sets, inactive/revoked memberships, settings updates, pagination, stale-write checks and atomic audit events |
| Authorization      | Reusable app checks plus PostgreSQL RLS and RPC guards; database membership/permissions remain authoritative; platform role is separate from tenant membership                        |
| Invitations / mail | One-use digests, verified-recipient acceptance, issuer rechecks and tenant-lock serialization; `EmailProvider` SMTP adapter requires TLS; transport success is not inbox receipt      |
| Tracker            | `src/modules/project-tracker/tracker-data.ts` powers the UI and is checked against `PROJECT_TRACKER.md`; UI checkpoint links to reviewed validation evidence                          |
| Verification       | `tests/e2e/`, colocated unit/contract tests, `supabase/tests/`, `scripts/test-database.mjs`, `scripts/tests/administration-concurrency.mjs` and `.github/workflows/ci.yml`            |

## Database and environment boundary

Four migrations were verified applied to the configured hosted project, in order:

1. `20260917000100_sprint_0_foundation.sql`
2. `20261028013153_fix_membership_self_read.sql`
3. `20261028022102_authentication_lifecycle.sql`
4. `20261030185852_sprint_0_administration.sql`

The administration migration was applied once after PR #2 merge with verified TLS and Supabase CLI history. New environments must apply the reviewed migration chain separately. Check actual history before any push; migration files are append-only. Never reset hosted databases or repair history merely to make a check pass.

Use the Supabase project explicitly configured in `.env.local`; never silently substitute a globally connected MCP project. Read values privately, verify the API project reference matches the database hostname/pooler username, and report identity without printing keys, passwords or connection URLs. `.env.example` documents names only.

- Application requests use publishable configuration and the authenticated user's session.
- `SUPABASE_SECRET_KEY` is the current server-only `sb_secret_...` key name for isolated test-account setup/cleanup. It is not an application authorization bypass and must never become `NEXT_PUBLIC_*`.
- Hosted `DATABASE_URL` uses certificate/hostname verification with the configured/bundled CA. `DATABASE_TEST_LOCAL=1` is restricted to explicit disposable loopback CI databases; do not use it to bypass hosted TLS.
- SMTP authentication can be verified without sending mail. Real delivery/link tests require controlled mailboxes or explicitly authorized recipients. Do not reuse addresses from old chats as a new blanket sending authorization.
- No credentials, browser tokens, raw reports, auth traces, screenshots, service logs or mailbox contents should be committed or uploaded. Authenticated tests disable captures; CI uploads sanitized summaries only.

## Critical invariants

- Tenant context comes from the authenticated principal and an active owned membership. Client IDs/roles are input to validate, never authority. Recheck permissions in server actions and RPCs.
- Role/status mutations and invitation acceptance share a tenant lock; retain at least one active administrator. Stale revisions reject overwrites. Never remove these controls to unblock tests.
- Inactive/revoked membership removes access to that tenant without deleting the global account or other memberships. Revocation is terminal in the implemented slice; reactivation is not implemented.
- Audit insertion and each administrative write are one transaction. Keep safe before/after metadata, actor attribution and request IDs; a failed audit insert must roll back the write.
- Financial tables and financial mutation behavior are not implemented. School payments and SaaS subscription billing must remain separate in future work. Currency updates are currently allowed only in the foundation model with no financial records; later billing work must address redenomination explicitly.
- Preserve Next.js version conventions: read relevant installed guides under `node_modules/next/dist/docs/` before changing framework code. Do not add dependencies without a concrete need.

## Verification runbook

Use pnpm and the frozen lockfile. Before a fresh typecheck, generate route types:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm exec next typegen
pnpm typecheck
pnpm test:ci-tools
pnpm test
pnpm format:changed
pnpm build
```

For hosted development verification (opt-in elevated test fixtures; never use as a production health probe):

```sh
pnpm check:supabase
pnpm check:smtp
pnpm test:db
```

After build, use an isolated local production server for the browser suite (PowerShell):

```powershell
$env:CI='true'
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:3109'
$env:E2E_SERVER_MODE='production'
pnpm test:e2e
node scripts/ci/browser-summary.mjs
```

`CI=true` selects sanitized diagnostics; it does not create local service credentials. Do not set `CI_ENFORCE_INTEGRATION` for hosted verification: that mode requires disposable local services and enables local-only committed concurrency fixtures. Standard browser runs may skip authenticated cases when credentials are missing; always inspect totals. CI forbids missing credentials, skipped/flaky tests and focused `.only` tests.

For focused diagnosis, the runner forwards Playwright options, e.g. `pnpm test:e2e --grep onboarding`. A focused pass is not evidence that the full suite passed. Browser fixtures create confirmed synthetic accounts, so those tests do not validate actual signup confirmation emails.

The Windows managed pnpm launcher previously stalled during concurrent automatic installs. Stop only task-owned processes; restore one frozen install, then retry verification. Keep generated caches ignored and do not change the package manager/lockfile as a workaround. Use the default port-3000 development server only after checking whether another process owns it; never kill unrelated sessions. A past dev-server smoke timeout remains separate from the passing isolated production-mode checks.

## Remaining acceptance work and debt

Bilingual foundation coverage is now implemented and verified; the root document language follows the validated request locale. Global error safety/retry is component-tested in both languages.

1. Validate real confirmation/recovery email links and invitation delivery/recipient receipt end to end. SMTP authentication, issuance/acceptance RPC tests and mocked adapters do not prove receipt.

Other documented limits: onboarding clears edited fields on validation failure; full formatting has legacy debt (29 files at the baseline), two moderate Vitest mocker advisories remain, and `public.touch_updated_at` has a pre-existing mutable-search-path advisor warning. Recheck advisories before remediation; never suppress failures or rewrite canonical specifications just to turn a check green. Backup/restore drills, broader accessibility/mobile review, deployment hardening and pilot UAT are separate operational gates.

## Branch, review and stop rules

All new work belongs on `edwakson/ScoGes_App` unless the owner changes that policy. Main is PR-only, with up-to-date `Required validation` checks enforced for administrators, no force pushes and no deletion. Re-read current GitHub settings before claiming enforcement still exists. Do not merge, deploy, apply a migration or rotate credentials based only on this handoff; use the current human request and existing explicit authorization.

Update the typed tracker and Markdown tracker together when milestone state changes; the drift test checks all IDs/status/progress rows. Record new evidence in `IMPLEMENTATION_LOG.md` and relevant domain documents. Keep dated historical results; clearly mark newer snapshots. The product specification and engineering frameworks define requirements and method, not live deployment status.

Handoff UI verification note: one local focused attempt timed out at the hosted login transition before reaching the tracker; an unchanged rerun passed the updated tracker assertions. No authentication implementation changed in this slice. If this recurs, inspect safe response/timing evidence before assigning a cause or weakening checks. Full isolated CI remains the required review gate.

## Sprint 1 proposal checkpoint — 2026-10-30

PR #4 is merged as `2c751624dde35d38abf47aafaac7deed45c550c1`; its review CI passed 69 unit/component/contract, 4 CI safety and 15 Chromium tests. The [bounded Sprint 1 prompt](prompts/SPRINT_1_MASTER_PROMPT.md) is proposed, inactive and subject to the [foundation completion gate](SPRINT_0_COMPLETION_GATE.md). The gate remains open for bilingual foundation completion and real email lifecycle validation. No Sprint 1 code, migration or permission grant is authorized by this proposal. Sprint 0 remains active; tracker statuses and percentages remain unchanged. Resolve documented business decisions before their affected implementation slices.

## Bilingual foundation update — 2026-10-31

PR #5 is merged (`4d8527d8682de96b439903b7858724ebff21345b`). This follow-up completes foundation translations and localized navigation. The `locale` query selects presentation only; the proxy overwrites `x-edxstore-locale`, and root layout uses that validated value for HTML language and client error context. French remains the default. Language switches perform full navigation because Next.js caches layouts. Auth destinations remain allowlisted; tenant and permission checks are unchanged. Public pages receive locale context without adding Auth refresh dependencies. No schema/dependency changes or real email sends. Historical open-bilingual notes above are superseded by this dated checkpoint; the email gate and Sprint 1 activation restrictions remain.

Bilingual follow-up verification: lint/typecheck/build/format checks passed, 77 unit/component/contract + 4 CI safety tests passed, and the complete production-mode Chromium suite passed 18/18 with no failures, skips or flaky results. Hosted SQL authorization/invitation/administration/audit assertions passed and rolled back their transaction. Authenticated test fixtures were cleaned up by the suite. The global error fallback is tested at component level; no hosted outage was induced. Refresh checks again after future email changes.
