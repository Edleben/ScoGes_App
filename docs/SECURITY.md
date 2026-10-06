# Security

## Tenant Isolation

Tenant isolation is enforced in layers:

- Supabase Auth establishes identity.
- `memberships` links users to tenants.
- Role permissions are checked server-side before sensitive actions.
- Tenant-scoped RLS policies restrict table reads.
- RPC functions verify `auth.uid()` against the provided actor before writing.

Client-provided `tenant_id`, role, permission, amount, or status values are never authoritative.

## Authentication

Supabase Auth is the authentication provider. Public Supabase URL and publishable key are browser-visible. The service-role key is server-only and must never be exposed as `NEXT_PUBLIC_*`.

## Authorization

Tenant permissions are modeled through:

- `roles`
- `permissions`
- `role_permissions`
- `memberships`
- `membership_roles`

Application helpers in `src/modules/identity/authorization.ts` provide reusable checks for tests and server logic. Database policies use `current_user_has_permission`.

## Audit

Sprint 0 audit events cover tenant creation and member invitation. The audit metadata helper strips common secret-bearing fields.

## Secrets

Only `.env.example` is committed. Real `.env` and `.env.local` files are ignored.

## Known Limitations

Supabase migrations are present but not applied in this repository. Production backup, restore drills, CSP hardening, rate limiting implementation, and storage policies must be completed before pilot production.
