# Authentication lifecycle — Sprint 0

## Implemented flows

- `/signup`: validated email/password/confirmation, Supabase email confirmation,
  and a generic response that does not identify existing accounts.
- `/login`: password sign-in with safe errors and allowlisted return destinations.
- `/auth/forgot-password`: validated recovery request with a real email field.
- `/auth/callback`: PKCE exchange, including the SSR flow identifier when supplied;
  failure returns a safe invalid/expired-link notice. Arbitrary redirects and
  request-host-derived redirect origins are rejected.
- `/auth/reset-password`: password/confirmation form for a verified live identity;
  successful update signs out Supabase refresh sessions globally and asks for a new
  login. A sign-out failure after an update is reported explicitly.
- `/invitations/accept`: capture a fragment token in an HttpOnly, SameSite cookie,
  authenticate with the invited email, then explicitly accept the invitation.
- `src/proxy.ts`: request-scoped Supabase client refreshes cookies on both request
  and response. Server helpers still call `getUser`; RPCs and RLS enforce access.

New forms, validation feedback, invitation email text and language links support
French and English. Foundation screens and navigation are now bilingual; real hosted email lifecycle validation has passed; Sprint 0 closure awaits final review.

## Required external configuration

The project configured in `.env.local` is authoritative. Do not use an unrelated
globally connected Supabase project. No application auth action uses an administrative
secret key. `SUPABASE_SECRET_KEY` (`sb_secret_...`) is reserved for server-side test
fixture setup/cleanup; it replaces the legacy service-role configuration. The new
key still bypasses RLS, so it must never enter browser code or a `NEXT_PUBLIC_` variable.

1. Set `NEXT_PUBLIC_APP_URL` to the actual browser origin. Use that same hostname
   when opening email links: PKCE verifiers are browser cookies, so `localhost`
   and `127.0.0.1` are not interchangeable. Production must use HTTPS.
2. In that project's Auth settings, retain email confirmation, enable email signup,
   configure the Site URL and allowlist the app's `/auth/callback` redirect URLs,
   including their `next` and `locale` query parameters. Use narrowly scoped
   callback patterns for each explicitly supported local/preview/production origin.
3. Configure Supabase Auth SMTP for signup-confirmation and recovery email. The
   app's `.env.local` SMTP settings do not configure Supabase's hosted mailer.
   Keep the confirmation/recovery templates' `{{ .ConfirmationURL }}` links.
   Provide French and English email text in those templates, for example:

   ```html
   <p>Confirmez votre demande / Confirm your request:</p>
   <a href="{{ .ConfirmationURL }}">Continuer / Continue</a>
   ```

4. Set server-only `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and
   `SMTP_FROM` (email address or `Name <email>`) for application invitation emails. Port 465
   uses implicit TLS; other ports require STARTTLS. Certificate checks stay enabled.
5. Run `pnpm check:smtp` to verify SMTP connection/authentication without sending
   an email. SMTP acceptance does not prove delivery to a recipient's inbox.

Confirmation and recovery links should be opened in the browser that initiated
the PKCE request. An expired, reused or cross-browser link requires a new request.
Supabase Auth owns public authentication rate limits and email quotas. Production
rate-limit/CAPTCHA configuration must be reviewed before public rollout.

## Invitations and authorization

`20261028022102_authentication_lifecycle.sql` is append-only. It adds delivery
status, replaces uniqueness over all invitation statuses with pending-email
uniqueness, and adds narrowly authorized RPCs. It preserves invitation history;
no business rows are deleted. Existing case-folded pending-email collisions would
stop migration rather than silently discard records.

- Issuance resolves the actor using `auth.uid()`, requires active tenant membership,
  `users.invite` and `users.manage_roles`, and restricts administrator-role assignment.
- Per-actor transactional locks enforce 20 invitations/hour; a recipient cooldown
  prevents repeated issuance within one minute. Reissuing rotates the token, resets
  its 14-day expiry and invalidates the previous link, with an audit event.
- Only a SHA-256 digest is stored. The unpredictable token is returned once to the
  authorized server action and sent via SMTP outside database transactions. The
  link uses a fragment, so the token is absent from HTTP URL/referrer logs.
- SMTP failures are recorded and reported. An unavailable mailer does not create
  an invitation or display a fake success. No automatic background retry is claimed.
- Acceptance checks the token, expiry/status, verified recipient email, active
  tenant and issuer's current permissions. Row locking prevents replay/concurrent
  acceptance. Existing memberships, including revoked ones, are never reactivated.
- Membership, assigned role, accepted status and business audit records are written
  atomically. Tenant/role input from the browser is not used during acceptance.
- The accepted tenant becomes a cookie preference. It is always revalidated against
  the signed-in user's own active membership; a forged/stale preference falls back
  to deterministic membership selection.
- The legacy UUID-returning invitation RPC remains available through the stricter
  issuance path. New application code uses the complete issuance/delivery flow.

The invitation cookie lasts one hour; reopen the email link if it expires during
account setup. Auth responses use `private, no-store` and `no-referrer`. Development
Server Function argument logging and callback request logging are disabled.
Deployment access logs must also redact callback codes; never enable credential
or auth-payload logging. Supabase maintains provider-side authentication audit logs;
business invitation/role events are stored separately in `audit_events`.

Supabase global sign-out revokes refresh sessions; issued access JWTs can remain
valid until their expiry. Immediate JWT revocation is not claimed by this feature.

## Verification

- `pnpm test`: action, callback, proxy-cookie, SMTP adapter, membership-resolution,
  and existing foundation tests. Provider failures are mocked in contract tests.
- `pnpm test:db`: real PostgreSQL/RLS/RPC tests; all fixtures and temporary schema
  setup roll back. Covers wrong/unverified email, expired/revoked/replayed tokens,
  revoked inviter, reissue, delivery failure, role assignment and tenant isolation.
- `pnpm test:e2e`: runs the actual Playwright suite, with bounded health checks and
  visible failures. Public tests do not send email. Live tests require the configured
  project's real server-only `SUPABASE_SECRET_KEY` to create and clean up exact
  isolated test-account/tenant IDs. They are explicitly skipped when it is missing.
  Those tests disable traces, screenshots and video. Use a development/test project.

The new secret-key configuration was verified on 2026-10-28: all 8 Chromium tests
passed, including the 3 previously skipped real-account tests. Temporary accounts
and tenant/membership rows were cleaned up. SMTP connection/authentication also
passed; actual email receipt and confirmation/recovery link exchange remain distinct
checks. See [Supabase's key migration guide](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys).

For an isolated production test server after `pnpm build` (PowerShell):

```powershell
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:3102'
$env:E2E_SERVER_MODE='production'
pnpm test:e2e
```

Email receipt, successful email-link exchange, and live SMTP delivery require real
provider configuration and mailbox verification. Mocked tests or skipped browser
tests are not evidence that these external integrations work.

Rollback is by a new corrective migration, never by rewriting applied history.
Previously issued links cannot be recovered from stored digests; reissue them.

## Current validation snapshot

The dated 8-test result above is historical. Administration deployment and the expanded authenticated onboarding, bilingual and failure-state coverage are recorded in [Sprint 0 validation](SPRINT_0_VALIDATION.md). Real confirmation/recovery email-link exchange and recipient inbox receipt remain distinct, unverified acceptance checks.

## Cross-agent continuation

Use [AI_HANDOFF.md](AI_HANDOFF.md) for the current branch, migration/environment boundary and safe runbook. The [tracker](PROJECT_TRACKER.md) keeps email-link/receipt validation open. SMTP credentials or an accepted transport result do not establish actual confirmation/recovery/inbox verification.

## Signup troubleshooting — 2026-10-31

An isolated signup against the configured hosted project returned HTTP 429, `over_email_send_rate_limit`; no account/session was created. Signup is enabled and confirmation remains required. This verifies an Auth email quota failure, not a database migration or locale failure. It does not establish whether the project uses built-in or custom SMTP: inspect Authentication SMTP and email rate-limit settings with project-owner access. The connected Supabase tool could not read this project’s logs, and no Management API token was configured; hosted settings were not changed.

Application SMTP environment variables configure invitation delivery only. Hosted confirmation/recovery delivery is configured separately in Supabase Auth. Configure/verify custom SMTP and review the provider-backed quota there; do not disable confirmation or bypass limits with an administrative key. A quota refresh alone is not proof of reliable production delivery.

Signup now distinguishes email/request throttling, unavailable confirmation delivery, disabled signup and rejected passwords with safe FR/EN messages. Unknown failures remain generic; existing-account responses remain indistinguishable. Structured server warnings contain only an allowlisted category and HTTP status, never raw provider messages, addresses or credentials. Failed submissions retain the entered email in component state; passwords reset and are never echoed or persisted.

The reported root/body hydration warning was not reproduced in clean Chromium on the existing development server in either language (correct HTML language, no extra body attributes, zero hydration warnings). The local development log then identified `data-new-gr-c-s-check-loaded` and `data-gr-ext-installed` in the body hydration diff, identifying Grammarly DOM injection. Turn Grammarly off for localhost and reload; do not add blanket hydration-warning suppression. No raw development logs or personal data are committed. E2E fixtures now fail on hydration warnings and uncaught exceptions while reporting counts only. Positive public-signup tests run only against explicitly isolated loopback Auth in CI and verify a real unconfirmed account, with exact synthetic-account cleanup. They do not close hosted inbox/link acceptance.

## Hosted email verification after owner SMTP setup — 2026-10-31

The owner subsequently configured Supabase Auth SMTP. Real confirmation, recovery and application invitation receipt/link completion passed using unique tagged addresses in the authorized test mailbox, in French and English. Old passwords were rejected after recovery; invitation membership/role and replay rejection were verified. Mail was read through verified-TLS IMAP using EXAMINE/BODY.PEEK, without changing flags or deleting messages. Only exact synthetic fixtures were removed. No existing account password was changed. This supersedes the earlier quota-blocked diagnosis as current state; see [email verification evidence](SPRINT_0_EMAIL_VALIDATION.md).
