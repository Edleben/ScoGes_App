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
