# Sprint 0 administration

`/dashboard/users` supports paginated member history, replacement of assigned predefined tenant roles, and membership deactivation/revocation. `/dashboard/settings` edits the existing country, base currency, timezone and default locale. French and English strings follow the existing locale convention. Loading, pending, empty, denied and dependency-error states are explicit.

## Security and semantics

- Server actions resolve the current authenticated membership and permissions. Submitted tenant context is only a stale-form guard, never authority. Target membership IDs are checked again against that tenant in PostgreSQL.
- Narrow RPCs `administer_tenant_membership` and `update_tenant_settings` use the established security-definer transactional-write pattern, an empty search path, authenticated-only execution, `auth.uid()`, active tenant checks and live database permission checks. No application secret/service-role client is used.
- Role changes replace the complete role set (one to five unique predefined tenant roles). Active memberships only; platform/custom roles are rejected. Only a current tenant administrator can grant/remove the tenant-admin role or disable an administrator.
- Active memberships may become inactive or revoked; inactive memberships may be revoked. Revocation is terminal in this slice. Reactivation and global-account deletion are outside this task. A revoked membership remains visible to authorized directory readers, with its role history retained. Other tenant memberships and the global account remain intact.
- At least one active administrator must remain. Membership changes lock the tenant row, then recheck authorization. Invitation acceptance shares that lock before validating the inviter's current authority. This serializes concurrent demotions/removals without trusting stale JWT role claims.
- Exact `updated_at` revisions reject stale edits. A focused trigger advances membership/settings revisions monotonically even within one transaction. Changing the selected tenant while a form is open requires reloading it.
- Settings validate alphabetic ISO-shaped country/currency codes, supported locales, and an actual database timezone. These checks do not provide a maintained ISO country/currency registry. Currency editing applies to the current Sprint 0 model, which has no financial records; later billing work must restrict redenomination/migrate financial data explicitly.

## Audit and migration

Migration: `supabase/migrations/20261030185852_sprint_0_administration.sql` (append-only; no populated columns/tables dropped and no existing migration rewritten).

Each successful mutation writes one audit row in the same transaction: `member.role_changed`, `member.deactivated`, `member.revoked`, or `tenant.settings.updated`. Rows include the authenticated actor, tenant, target, generated request ID, and safe before/after roles, statuses or settings. No passwords, tokens, email payloads or full profiles are stored. Unchanged role/settings submissions return a no-op and add no misleading audit event. An audit insertion failure rolls back its associated write.

The migration also permits authorized `users.read` identities to identify revoked members. Self-profile access is unchanged; revoked identities gain no tenant directory or settings access.

Apply through the normal reviewed migration process after validating the PR. This implementation does not install the migration permanently on the hosted `.env.local` project. An old hosted schema cannot use the new controls until that deployment step. PostgreSQL rollback of the migration requires a reviewed forward migration restoring prior RPC/trigger/policy definitions; do not reset the database or rewrite migration history.

## Verification

- Unit tests: form schemas, permissions, forged/stale context, safe errors, normalized settings and honest no-op responses.
- `pnpm test:db`: transactional SQL assertions under real database roles, including tenant crossover, active low-privilege and anonymous access, last-admin guards, fresh revisions, audit attribution, no-op behavior, audit-insertion failure rollback, and revoked-session access denial. Fixtures and temporary DDL roll back on hosted development tests.
- Isolated CI runs local Supabase security advisors, failing on error-level issues. It also races two administrator removals/demotions using separate database connections. Committed synthetic race fixtures are allowed only with explicit loopback CI configuration and cleaned by exact IDs.
- Browser tests exercise role changes, read-only permissions, deactivation/revocation, continued access to another tenant, settings persistence, audit history and last-admin errors. Existing authentication/invitation tests remain in the suite. These new browser tests require the migration, so use isolated CI until the hosted migration is deployed.

No Sprint 1 or financial-domain functionality is introduced.
