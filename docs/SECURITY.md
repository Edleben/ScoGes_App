# Security

## Tenant Isolation

Tenant isolation is enforced in layers:

- Supabase Auth establishes identity.
- `memberships` links users to tenants.
- Role permissions are checked server-side before sensitive actions.
- Tenant-scoped RLS policies restrict table reads.
- RPC functions check `auth.uid()` and live permissions before writing; legacy actor parameters must match the authenticated principal.

Client-provided `tenant_id`, role, permission, amount, or status values are never authoritative.

## Authentication

Supabase Auth is the authentication provider. Public Supabase URL and publishable key are browser-visible. The administrative `SUPABASE_SECRET_KEY` (`sb_secret_...`, preferred over the legacy service-role key) is server-only and must never be exposed as `NEXT_PUBLIC_*`. Application auth actions do not use administrative keys; isolated live test fixtures use the secret key for setup/cleanup only.

## Authorization

Tenant permissions are modeled through:

- `roles`
- `permissions`
- `role_permissions`
- `memberships`
- `membership_roles`

Application helpers in `src/modules/identity/authorization.ts` provide reusable checks for tests and server logic. Database policies use `current_user_has_permission`.

## Audit

Sprint 0 audit events cover tenant creation, invitation issuance/delivery/acceptance, role assignment/change, settings updates and membership deactivation/revocation. Administrative events and their mutations share a transaction with safe before/after metadata and generated request IDs. The application metadata helper strips common secret-bearing fields; RPCs construct their metadata explicitly.

## Secrets

Only `.env.example` is committed. Real `.env` and `.env.local` files are ignored.

## Known Limitations

The four-migration chain in [DATA_MODEL.md](DATA_MODEL.md) was verified applied to the configured hosted project on 2026-10-30. Other environments must apply the reviewed chain independently. Production backup, restore drills, CSP hardening, rate limiting implementation, and storage policies must be completed before pilot production.

## Membership Self-Resolution

Active users can read their own membership and assigned roles without `users.read`.
Reading other members and their profiles still requires `users.read` in the same tenant.
Inactive memberships do not gain self-access. Database failures raise a safe error
instead of being interpreted as missing membership and redirected to onboarding.

Real database authorization tests and their limits are documented in
[Database testing](DATABASE_TESTING.md). SQL RLS/RPC tests run under database roles;
unit helper tests alone are not evidence of database isolation.

## Authentication Lifecycle

Signup/recovery, PKCE callbacks, password updates, session refresh, SMTP delivery,
and invitation acceptance are implemented as described in
[Authentication lifecycle](AUTHENTICATION.md). Invitation acceptance binds the verified
recipient identity to the database-stored invitation; tenant/role fields from the
browser are not authoritative. Passwords/tokens are excluded from application and
development action logs. Hosted Auth SMTP/redirect settings and live mailbox delivery
remain external configuration requirements; unverified delivery is not reported as working.

## Administration writes

Role/status/settings mutations now use permission-checked RPC transactions with tenant-row serialization, last-active-administrator protection, stale revision checks and atomic audit writes. Invitation acceptance shares the authorization lock. Revocation removes tenant access through live membership/RLS checks while preserving other memberships. See [Administration](ADMINISTRATION.md).

## Sprint 0 validation follow-up

Onboarding no longer returns raw database/transport errors. Duplicate slugs receive safe localized feedback; other failures use the generic service-unavailable response, and malformed RPC results cannot produce a success redirect. Unit/component tests exercise provider failures without disrupting hosted services. See [Validation evidence](SPRINT_0_VALIDATION.md) for coverage limits and outstanding security/deployment debt.

## Evidence and handoff limits

The [validation report](SPRINT_0_VALIDATION.md) separates actual SQL/browser verification from mocked provider failures and unverified email receipt. The existing `public.touch_updated_at` search-path warning and two moderate development dependency advisories remain dated known debt; recheck before remediation. Preserve TLS, RLS, server permissions, audit rollback, last-admin protection and CI checks during any agent handoff. See [AI_HANDOFF.md](AI_HANDOFF.md).

Locale is presentation-only. The proxy overwrites incoming locale headers, permits only French/English, and keeps session-cookie forwarding, no-store and no-referrer behavior on authentication-sensitive routes. Localized redirects continue to use the existing allowlist before adding locale; no arbitrary return URL is trusted. Global error output never renders raw exceptions.
