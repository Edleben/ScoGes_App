# Sprint 0 validation — 2026-10-30

Sprint 0 is operational at the foundation level, with remaining acceptance work. The tracker is a manually maintained engineering checklist, not live CI telemetry or a production-readiness certificate. No Sprint 1 work was started.

## Execution results

| Check                         | Result                                   | Evidence / limit                                                                                                                          |
| ----------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen-lockfile install       | Passed                                   | Existing locked versions restored; no dependency or lockfile update                                                                       |
| ESLint                        | Passed                                   | `pnpm lint`                                                                                                                               |
| Route generation / TypeScript | Passed                                   | `pnpm exec next typegen`, `pnpm typecheck`                                                                                                |
| Unit/component/contract tests | 68 passed                                | Includes onboarding error redaction and FR/EN dependency-error rendering                                                                  |
| CI safety tests               | 4 passed                                 | Local-only fixture guards, hosted TLS verification, missing/skipped browser report rejection                                              |
| Production build              | Passed                                   | `pnpm build`; current final browser execution recorded below                                                                              |
| Hosted SQL security tests     | Passed                                   | Real PostgreSQL roles/RLS; invitation, role/status, stale-write and audit-failure rollback assertions; fixtures/temporary DDL rolled back |
| Auth/schema connectivity      | Passed                                   | Auth and membership endpoints returned HTTP 200                                                                                           |
| SMTP authentication / TLS     | Passed                                   | `pnpm check:smtp`; no real email sent by this validation                                                                                  |
| Dependency audit              | Blocking threshold passed                | Zero critical/high findings; two moderate development-tool findings remain                                                                |
| Full repository formatting    | Failed: 29 pre-existing files            | Check only; canonical specifications and unrelated files are not rewritten                                                                |
| Changed-file formatting       | Passed                                   | CI ratchet; excludes generated lockfile                                                                                                   |
| Chromium end-to-end           | 15 passed; zero failed, skipped or flaky | Production server on isolated loopback port, configured hosted development backend; synthetic users/tenants only                          |
| Isolated CI                   | Required gate; see this PR’s checks      | Fresh migrations, security advisors, multi-connection administrator-removal races and Chromium; no production secrets                     |

Local dependency bootstrapping initially stalled in the managed pnpm launcher. Duplicate validation commands were stopped; one frozen-lockfile install restored a consistent environment. Those interrupted commands are not counted as passing checks.

## Journey and failure-state coverage

| Area                     | Verified evidence                                                                                                                                                             | Remaining limit                                                                                                                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authenticated onboarding | Browser login without membership → invalid form → duplicate slug → valid creation → dashboard; authoritative tenant settings, admin permission and creation audit checked     | Accounts are pre-confirmed synthetic fixtures; this does not prove signup email confirmation. The uncontrolled onboarding form resets edited fields after validation failure; callers must re-enter the complete form |
| Member lifecycle         | Invitation acceptance, selected tenant, replay denial, role changes, read-only permissions, deactivation/revocation, retained access to another tenant, last-admin protection | Invitation issuance in the browser acceptance test uses the real RPC; invitation-form submission through SMTP/inbox receipt is not covered                                                                            |
| Settings                 | Persisted updates, FR/EN form validation, stale browser form rejected after a newer committed update; only one successful audit event                                         | ISO-shaped codes are validated; no maintained ISO registry is claimed                                                                                                                                                 |
| Public authentication    | French/English login and signup labels, invalid credentials, password mismatch, recovery/reset invalid-link states                                                            | Actual confirmation/recovery email-link exchange and recipient inbox receipt remain unverified                                                                                                                        |
| Dependency failure       | Unit/component/contract tests cover unavailable client, database errors, rejected RPC transport and SMTP failure; user-visible errors exclude raw provider details            | Hosted services were not deliberately disabled; mocked outage behavior is not a live outage drill                                                                                                                     |
| Permission / isolation   | Browser denied/read-only states plus real SQL negative authorization, forged/cross-tenant targets, revoked JWT access and audit rollback tests                                | Broader support/platform-admin operations and later-sprint permissions are outside this slice                                                                                                                         |
| Empty states             | Empty paginated directory page and safe distinction between unavailable data and empty results                                                                                | No populated data was deleted to force an empty state                                                                                                                                                                 |
| Accessibility            | Labeled forms, semantic controls, confirmation controls and role-based assertions exercised                                                                                   | Full keyboard/mobile/screen-reader/WCAG audit not performed                                                                                                                                                           |

## Bilingual coverage

| Surface                                                       | French                  | English                                                                |
| ------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------- |
| Public auth labels and validation                             | Covered                 | Covered                                                                |
| Member administration content / role labels                   | Covered                 | Covered via `?locale=en`                                               |
| Settings content / validation                                 | Covered                 | Covered via `?locale=en`                                               |
| Dependency-error and denied page responses                    | Component checks        | Component checks                                                       |
| Onboarding screen and form                                    | Browser journey covered | UI remains French; new safe action messages support both locales       |
| Application shell, dashboard, tracker and global error screen | Existing French UI      | Translation remains pending; shell navigation does not preserve locale |

The root document still declares French; localized auth/administration regions declare their language separately. This is partial bilingual coverage, not a fully localized application.

## Tracker reconciliation and acceptance gaps

Sprint 0 is now **in progress**, with four delivered foundation milestones and two explicitly planned acceptance milestones. Its **67%** is `round((100 + 100 + 100 + 100 + 0 + 0) / 6)`, an unweighted internal checklist score. It is not a measurement of code coverage or an assertion that the SaaS is 67% complete. Future sprints remain planned at zero.

Remaining acceptance work:

1. Complete onboarding/shell/dashboard/global-error translations and locale-preserving navigation.
2. Validate actual confirmation/recovery links and invitation delivery/recipient receipt end to end using a controlled mailbox or approved test recipients.

Known engineering debt remains visible: full-repository formatting, two moderate Vitest mocker advisories, and the pre-existing `public.touch_updated_at` mutable-search-path advisor warning. Production backup/restore drills, broader accessibility testing, and deployment hardening remain separate pilot-readiness work as described in `SECURITY.md`.

## Deployment and data integrity

Administration migration `20261030185852_sprint_0_administration.sql` was applied once to the `.env.local` project after PR #2 was reviewed and merged. Verified TLS, history, RPC grants, revision triggers, RLS, anonymous API denial and the then-current 10 browser tests passed. This validation adds no migration and changes no existing role, financial or tenant business rule.

The only application correction is safe onboarding failure handling: duplicate slugs receive localized feedback; unexpected database/transport/configuration errors return a safe service error; malformed RPC identifiers cannot report success. Successful onboarding still uses the authenticated actor, the existing transactional RPC and the same dashboard redirect.

UI-created fixtures are discovered only through exact synthetic actor IDs plus the test slug prefix, then deleted by exact tenant/user IDs, including after assertion failures. Credentials, raw browser reports and test artifacts remain ignored; nothing is sent to real recipients by these checks.

Final hosted checks confirmed zero synthetic E2E users/tenants remaining and the same four applied migrations. The final 15-test browser run had no failures, skips or flaky results. No real email was sent.

The first onboarding browser assertion assumed retained form values; the corrected test explicitly resubmits the complete form after each validation response. The full suite subsequently passed. The E2E runner now forwards standard Playwright arguments, enabling focused diagnosis without changing normal full-suite behavior.
