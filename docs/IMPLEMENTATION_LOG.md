# Implementation Log

## 2026-09-17 Sprint 0 Foundation

Implemented repository initialization and platform foundation:

- Next.js 16 App Router project configuration.
- TypeScript strict, ESLint, Tailwind CSS v4, Vitest, Playwright.
- Supabase foundation migration for tenants, settings, profiles, memberships, RBAC, invitations, and audit events.
- Server-side Supabase clients and session helpers.
- Tenant onboarding and member invitation server actions.
- Responsive administration shell and Sprint 0 routes.
- English/French i18n message foundation.
- Unit tests and Playwright smoke test.
- GitHub Actions CI.

The formal DOCX requested by the repository policy is not present in the workspace. The available product sources are `PRODUCT_SPEC.md` and `Cahier_des_charges_SaaS_Gestion_Scolarite_V2.pdf`.

## 2026-09-18 Project Tracker

Added a Sprint monitoring dashboard for management and delivery tracking:

- `src/modules/project-tracker/tracker-data.ts` defines typed sprint and feature tracking data.
- `/dashboard/project` displays sprint progress, roadmap status, feature descriptions, ownership areas, and quantitative progress bars.
- The main dashboard links to the tracker and summarizes global delivery progress.
- Sprint 1+ items are marked as planned only; no Sprint 1 implementation work was started.

## 2026-10-28 Supabase Connection and Membership Isolation

- Verified configured Supabase HTTPS Auth and direct PostgreSQL connectivity without logging credentials.
- Found an empty application database; reproduced the cashier self-resolution failure against the original migration inside a rolled-back transaction.
- Added and applied an append-only RLS migration allowing active self-membership/role reads while retaining permission checks on other members and profiles. Applied the existing foundation migration first through Supabase CLI migration history.
- Made active membership selection deterministic; database query failures now raise a safe error rather than returning a false missing-membership result.
- Added real transactional database tests for tenant isolation, missing permissions, forged actors, self-role escalation, deactivation, and anonymous access, plus session unit regression tests.
- Added credential-safe connection checks and a development-only PostgreSQL test driver. Database tests use verified TLS with the bundled public Supabase CA.
- No financial domains or later sprint functionality were implemented. The project tracker completion claim and remaining Sprint 0 flows were not changed by this task.
- Verification: lint, standalone typecheck, 13 unit tests, production build, HTTPS connection checks, and real database authorization tests passed. The existing E2E command failed; direct Playwright diagnostics confirmed the required Chromium headless executable is not installed. No authenticated browser flow is claimed as verified.

## 2026-10-28 Chromium Installation and Browser Smoke Follow-up

- Confirmed that `.env.local` targets Supabase project `jlaufrjmjjheisdqkkao`; no conflicting URL/database process-environment overrides were present. HTTPS Auth and membership schema checks returned HTTP 200. The global Codex Supabase connection was not used for database changes.
- Confirmed the root product specification, sprint prompt, STABLE framework, and AI coding instructions match their copies under `docs/` and `ai-rules/`. Repository requirements and the active sprint remain governing constraints; departures require the owner's approval.
- Installed the Chromium revision matched to the existing Playwright dependency, including its headless shell and browser support binaries. No package versions or application code were changed for this follow-up.
- The default port-3000 browser test timed out during initial navigation. A separate production server on port 3100 passed the same Chromium assertions: landing-page heading, login link navigation, login URL, and login heading.
- Stopped the temporary production server and diagnostic test process; left the pre-existing port-3000 server untouched. The development-server timeout remains unresolved. Authenticated onboarding is not covered by this public smoke test.

## 2026-10-28 Authentication Lifecycle

- Added validated French/English signup, recovery and password-update forms, PKCE callback handling, safe errors and allowlisted return destinations. Kept Supabase email confirmation enabled.
- Added a request-scoped session-refresh proxy that propagates cookies to both request and response and disables caching. Server identity, membership and RLS checks remain authoritative.
- Added transactional invitation issuance/reissue, delivery-status recording and verified-email acceptance. Token digests, cooldown/rate limits, one-time acceptance, issuer checks and audit events protect membership/role writes; revoked memberships are not reactivated.
- Applied `20261028022102_authentication_lifecycle.sql` to the `.env.local` project through Supabase migration history after testing it in a rolled-back transaction. No financial domain changes or migration-history rewrites were made.
- Added a provider-independent email interface and TLS-required, bounded SMTP adapter. An unavailable provider or failed send returns an explicit failure. Tokens use email URL fragments and a short-lived HttpOnly cookie rather than query parameters.
- Accepted invitations select a tenant preference that is revalidated against the user's active membership; forged/stale cookie preferences fall back safely.
- Disabled development Server Function argument logging and callback URL logging to avoid password/token disclosure. Documented deployment log redaction, hosted Auth SMTP/redirect setup, and the limits of JWT revocation.
- Corrected the E2E runner's unbounded health probe and swallowed errors; it now runs the Playwright suite on a configurable local port and only cleans up its own server.
- Verification: 34 unit/contract tests passed; deployed PostgreSQL/RLS/invitation assertions passed with fixtures rolled back; lint, standalone typecheck and production build passed. Chromium E2E: 5 public tests passed, 3 real-account tests explicitly skipped because the service-role key remains a placeholder.
- External blockers at the last check: SMTP variables are absent; a real service-role key is needed only for live test-account setup/cleanup. Hosted Supabase Auth SMTP/redirect settings and actual confirmation/recovery/invitation email receipt remain unverified. This entry does not claim full live lifecycle verification or Sprint 0 completion.

## 2026-10-28 Secret Key and Live Authentication Verification

- Updated test fixture configuration to `SUPABASE_SECRET_KEY` (`sb_secret_...`) in accordance with Supabase's current key model; `.env.local` remains the project source. The secret key is never used by application user requests or exposed to the browser.
- Verified SMTP connection/authentication without sending email. Added support for the configured standard `Name <email>` sender format, with typed normalization and rejection of multiple addresses and header injection.
- Chromium: all 8 tests passed, with no skips. Real temporary accounts verified login/logout, protected access, invitation acceptance and tenant selection, replay denial, password update, and old-password rejection.
- Verified cleanup: no E2E accounts, tenants or memberships remained after testing. No existing business data or credentials were changed.
- Unit/contract tests: 35 passed. Real email delivery/receipt and hosted confirmation/recovery links remain separate checks requiring an authorized test recipient and mailbox verification.
- After explicit recipient authorization, sent two separate technical SMTP control messages; both were accepted by the SMTP server. Test reference: `SCG-1793161266969-b8a9809f`. These were diagnostic messages, not confirmation/recovery or active invitation links; inbox receipt is a separate check.

## 2026-10-30 CI validation gates

- Added push, PR, merge-queue and manual validation with an aggregate required gate.
- Added disposable local Supabase migrations, RLS/database tests, TLS SMTP verification and production-mode Chromium tests without production secrets.
- Added CI configuration guards, redacted browser diagnostics, short-lived safe reports, pinned actions/tools, and changed-file formatting checks.
- Approved minimum dependency security updates are included; verification results are reported separately.
- No application feature scope or hosted database schema was changed. See [CI operations](CI.md).

## 2026-10-30 Sprint 0 administration

- Added tenant-scoped role-set changes, membership deactivation/revocation, settings forms and paginated member history with explicit server-side permission/error states.
- Added an append-only migration with transactional audit writes, last-admin protection, tenant locking, stale revisions and invitation acceptance serialization.
- Added schema/action tests, negative SQL authorization and audit rollback assertions, CI-only concurrency fixtures, and administration browser journeys.
- Hosted database migration remains a reviewed deployment step; local SQL verification rolls back all changes. See [Administration operations](ADMINISTRATION.md).

## 2026-10-30 Administration deployment and Sprint 0 validation

- After PR #2 was reviewed/merged, applied migration 20261030185852 once to the configured hosted project with verified TLS and Supabase migration history. Existing record counts were unchanged; SQL tests and all then-current 10 browser tests passed and test fixtures were cleaned up.
- Added real browser onboarding (including invalid/duplicate input), French/English administration validation, stale browser writes, and localized invalid-credential checks. Added component tests for safe unavailable/denied responses.
- Corrected onboarding's raw database-error exposure with localized safe errors, a duplicate-slug message and validated RPC result identifiers. Successful creation/actor/redirect behavior is preserved.
- Reconciled the tracker: four delivered milestones plus two planned acceptance items yield 67%; Sprint 0 remains in progress. Full translations and real email-link/receipt validation remain unverified. No later sprint was started.
- See [Sprint 0 validation evidence](SPRINT_0_VALIDATION.md) for executed checks, failures/debt, environment limits and final browser/CI results.

## 2026-10-30 Project records and shared coding-agent handoff

- Verified PR #3 merged and synchronized the feature branch with its main merge without rewriting history.
- Added a Markdown tracker for every sprint/milestone and a drift invariant against UI data; retained Sprint 0 at 67% with translation and email acceptance work open.
- Added an accessible dated UI checkpoint with reviewed evidence links and explicit manual-checklist semantics.
- Added one shared handoff, Claude/Antigravity entry files and AGENTS navigation; documented environment identity, schema, security invariants, verification, branch policy and stop conditions.
- Reconciled operational architecture/data/security/auth/admin/database-testing/CI/decision documents and indexed governing specifications/frameworks without rewriting their requirements.
- No schema, dependency, authentication, authorization, financial or later-sprint behavior changes are introduced. This handoff records verification in its PR/CI checks; PR #3 remains the dated functional baseline.

- Local handoff checks: lint, generated types, TypeScript, production build and 69 unit/component/contract tests passed; the relative-link audit found no broken targets. The focused authenticated tracker journey passed on an unchanged rerun after one initial hosted login-transition timeout. This is not reported as a full new hosted-suite pass; current full-suite results belong to the PR/CI checks.

## 2026-10-30 — Bounded Sprint 1 proposal

Prepared an inactive [Sprint 1 prompt](prompts/SPRINT_1_MASTER_PROMPT.md) covering academic references, students/guardians, enrollments and CSV/XLSX imports, with explicit exclusions, business decision points, tenant/audit safeguards and verification criteria. Added the [foundation completion gate](SPRINT_0_COMPLETION_GATE.md): bilingual completion and real email lifecycle acceptance remain open. Sprint 0 stays active; all tracker percentages remain unchanged. This documentation task makes no application, dependency, schema or hosted-environment change.

Verification: all 4 tracker invariant tests passed; formatting passed for all 6 changed/new Markdown files; 48 relative document links resolved; `git diff --check` passed. Vitest emitted a Vite config-loader compatibility warning without failing. Full application, browser and database suites were not rerun for this documentation-only proposal; historical CI results are dated evidence, not a new completion-gate pass.

## 2026-10-31 — Bilingual foundation coverage

Completed FR/EN onboarding, shell, dashboard, tracker, landing/404 and safe global-error content. Preserved locale through internal links and authentication/onboarding/invitation/logout redirects; request locale sets root document language and client error context. Language-switch links reload cached layouts deliberately. Existing allowlisted auth destinations, membership resolution, server permissions, RLS and transactional mutations remain unchanged. No new dependency, migration, hosted deployment or email send. Updated both trackers to five of six milestones (83%); email acceptance keeps the foundation gate open and Sprint 1 inactive. See [validation](SPRINT_0_VALIDATION.md) for actual checks and limits.

Verification: final lint/typecheck/build and changed-file formatting passed; 77 unit/component/contract tests, 4 CI safety tests and 18 production-mode Chromium tests passed (zero failures/skips/flaky cases). Hosted SQL authorization, invitation lifecycle and transactional administration/audit assertions passed and rolled back fixtures. Real email delivery and live dependency-outage drills remain unverified. Initial browser-test expectation/synchronization failures were corrected before the final full passing run. No dependency or lockfile changes.

## 2026-10-31 — Signup quota diagnostics and hydration regression checks

Reproduced hosted signup failure as 429 `over_email_send_rate_limit`, with no account/session created. Added safe FR/EN classifications for signup rate limits, confirmation transport restrictions, disabled signup and weak passwords; existing-account responses remain generic. Added sanitized category/status warnings and preserved entered email on failed forms while clearing passwords. Added error-classification/form tests, browser hydration/runtime error gates and positive public signup against isolated CI Auth only. Clean development probes did not reproduce the reported hydration warning; the local development log identified Grammarly-injected body attributes (`data-new-gr-c-s-check-loaded`, `data-gr-ext-installed`). The appropriate local remedy is disabling Grammarly for localhost and reloading; no warning suppression was added. No hosted settings, schema, dependencies or authorization controls changed. Real hosted email acceptance remains blocked. Verification results follow after checks execute.

Verification: 96 unit/component/contract tests and 4 CI safety tests passed; lint, route type generation, typecheck, production build and changed-file formatting passed. All 18 hosted-backed production-mode browser tests passed with zero failures/skips/flaky results and the new zero-hydration/uncaught-exception assertions. Real public-signup success cases are isolated-CI-only and await that run. A focused development-mode rerun could not run because the existing port-3000 server was unhealthy/locked; it was not killed or replaced. Earlier clean development probes passed. Hosted quota/SMTP settings remain unchanged and require owner access.

## 2026-10-31 — Real hosted email lifecycle verified

After owner Auth SMTP setup, verified real signup confirmation, password recovery (old password rejected/new password accepted), application-issued invitation receipt, acceptance, authoritative cashier membership and replay rejection in FR/EN. Used unique tagged addresses in the authorized test mailbox with read-only verified-TLS IMAP; no existing user passwords were changed. All attempts cleaned up exact synthetic accounts/tenants. Two invitation harness attempts timed out on an exact role-label locator before sending; the corrected English invitation and complete French sequence passed. No provider settings, quotas, schemas or dependencies were changed by the agent.

Updated both trackers to six of six technical milestones (100%) and added an explicit localized final-review state. Sprint 0 remains in progress until final validated PR review/owner acceptance; Sprint 1 stays planned. [Email evidence](SPRINT_0_EMAIL_VALIDATION.md) records scope and limits without secrets or recipient identifiers. Reconciliation checks are refreshed before handoff.

Reconciliation verification passed: lint, route type generation, typecheck, format check, production build, 96 unit/component/contract tests, 4 CI safety tests, SQL/RLS/transactional audit assertions and the full 18-case hosted-backed browser suite (zero failures/skips/flaky results). Four hosted migration versions are unchanged; recent controlled email-test accounts and tenants count zero. All 72 relative document links resolved. Final isolated CI/review remains the merge gate.

## 2026-10-31 — Expired/reused mail links and delivery-failure verification

Updated the feature branch from merged PR #6. Added isolated FR/EN tests for actual mail receipt, confirmation/recovery completion and reuse, forced fixture expiry, invitation acceptance/expiry/reuse, and TLS SMTP recipient rejection with authoritative delivery/audit checks. Replaced the two shallow CI signup-only cases; 32 browser cases are registered. Added hosted/deceptive endpoint guards around expiry/cleanup CLI operations and safe recovery transport-error unit tests. Production application behavior, migrations and dependencies are unchanged.

Hosted controlled negative checks passed in English, including actual received-link expiry/reuse and a task-owned SMTP 421 refusal process. No global clock/lifetime or hosted mail setting changed; four exact accounts and one tenant were cleaned up. Local lint/typecheck/build/format, 98 unit/component tests, 6 safety tests and all 18 hosted-backed browser tests passed. All 32 isolated browser cases passed for `73b6a11`, including every new FR/EN mail case, with zero failures/skips/flaky results; both required push/PR gates passed. Supplemental review is [PR #7](https://github.com/Edleben/ScoGes_App/pull/7).

## 2026-11-01 — Sprint 0 closure candidate

Verified PR #7 merged as `6a76c43` and fast-forwarded the clean policy branch. Prepared [PR #8](https://github.com/Edleben/ScoGes_App/pull/8) for exact-head regression validation and owner acceptance. Updated UI/Markdown checkpoints and FR/EN review messages, corrected stale README/validation claims, and reconciled the shared Codex/Claude/Antigravity handoff. All six technical milestones stay complete; Sprint 0 remains in progress pending explicit acceptance, and Sprint 1 remains inactive.

[Risk triage](SPRINT_0_CLOSURE.md) records zero high/critical and three moderate development-tool audit findings, 19 pre-existing full-format failures, the existing trigger search-path warning, shared ingress/header hardening, onboarding UX and pilot operational limits. SQL invitation rate/cooldown controls remain intact. No dependency, schema, permission, tenant, financial or mail-provider behavior changes. Final closure-head check results and immutable run links are recorded in PR #8 after execution; no pending check is predeclared passed.

## 2026-11-01 — R1–R7 remediation record and owner decision

Recorded the owner’s explicit decision to keep Sprint 0 open for remediation and reject the proposed deferrals. Added [a resumable R1–R7 backlog](SPRINT_0_REMEDIATION.md) with dated evidence, assessed severity/priority, impact, existing controls, responsible functions, pilot gates, concrete remediation/acceptance criteria and verification steps. Reconciled the closure register, completion gate, documentation map, Markdown tracker and shared handoff. Responsible functions are not claimed as assigned individuals, and no due dates or remediation passes are fabricated.

Documentation only: no application code, dependencies, schema, hosted configuration, email sends, tracker percentages, deployment or Sprint 1 changes. Recommended immediate bounded slices are R1/R2 plus R3 security work; R4 planning precedes pilot. Verification passed: all four tracker consistency tests, formatting for the seven changed/new Markdown documents, 74 relative documentation links and `git diff --check`. Full application/build/browser/database suites were not rerun for this documentation-only update. The existing Vite config-loader warning remains non-failing.

## 2026-11-01 — R1 compatible dependency patch (partial)

Preserved and committed the requested R1–R7 documentation, then raised the Vitest minimum to 5.0.3 with a narrowly scoped lockfile update. Fresh audit removes both mocker advisories, leaving one moderate minimatch finding and zero high/critical. Frozen install passed. No new dependency, blanket minimatch major override, audit suppression, application logic or schema/hosted change. [The R1 record](R1_DEPENDENCY_REMEDIATION.md) cites upstream findings, installed callable-API consumers and the remaining supported-update/backport/migration work. R1 stays partial, other risks open; owner acceptance is not inferred from merged PR #8. Local regression passed: lint, generated route types, typecheck, all 98 unit/component tests, 6 CI safety tests and production build. The initial formatting check caught task-generated Next type imports; those generated-only changes were restored before the final formatting ratchet. The remaining moderate minimatch advisory stays visible; isolated Chromium/database/concurrency verification belongs to the new PR head.
