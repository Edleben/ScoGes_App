# Data Model

Current hosted checkpoint — **2026-11-11**: PR #10 is merged; the R2 helper and R3 direct-RPC quota migrations are now applied to the configured project and post-deployment checks passed. [Deployment evidence](DEPLOYMENT_2026-11-11.md) supersedes older pending-deployment notes below. Full advisor refresh, Vercel/monitoring and Sprint 0 acceptance remain open; Sprint 1 is inactive.

## Sprint 0 Tables

- `tenants`: tenant identity, slug, lifecycle status.
- `tenant_settings`: tenant locale, country, currency, timezone.
- `profiles`: application profile linked to `auth.users`.
- `roles`: tenant role catalog.
- `permissions`: permission catalog.
- `role_permissions`: role-to-permission mapping.
- `memberships`: user membership in a tenant.
- `membership_roles`: assigned tenant roles per membership.
- `invitations`: invitation records with hashed tokens.
- `audit_events`: append-only business audit baseline.

## Constraints and Indexes

The initial migration defines UUID primary keys, foreign keys, tenant slug uniqueness, tenant/user membership uniqueness, invitation uniqueness, and indexes for membership lookup, invitations, and tenant audit timelines.

## Invitation Lifecycle

The authentication lifecycle migration adds `invitations.delivery_status` and a
partial unique index for pending invitations by tenant and case-folded email.
Invitation acceptance transactionally inserts membership/role records and audit
events. Only token digests are stored; acceptance never reactivates an existing
membership. See [Authentication lifecycle](AUTHENTICATION.md).

## Financial Model Boundary

No financial production tables are created in Sprint 0. Billing, invoices, payments, allocations, receipts, refunds, and SaaS subscription billing belong to later sprints and must remain structurally separate.

## Administration lifecycle

The administration migration adds two narrow write RPCs and a monotonic revision trigger on memberships/settings; no tables or financial entities are added. It preserves revoked membership records and role mappings, extends authorized directory profile reads to revoked members, and records safe before/after audit metadata in each write transaction. See [Administration](ADMINISTRATION.md).

## Verified migration chain

| Version        | Scope                                                                        | Hosted checkpoint        |
| -------------- | ---------------------------------------------------------------------------- | ------------------------ |
| 20260917000100 | Foundation tables, catalog, RLS and onboarding RPC                           | Applied                  |
| 20261028013153 | Active self-membership/role resolution                                       | Applied                  |
| 20261028022102 | Invitation digest/delivery/acceptance lifecycle                              | Applied                  |
| 20261030185852 | Transactional administration, monotonic revisions and shared invitation lock | Applied once after PR #2 |

All four were verified in the configured hosted migration history on 2026-10-30. This dated record is not permission to assume another environment is migrated. Check actual history before deployment. Role sets remain normalized; inactive/revoked memberships are retained. Administrative audit metadata records curated before/after values, actor/target and request IDs without credentials. See [handoff](AI_HANDOFF.md) and [tracker](PROJECT_TRACKER.md).

## R2 prepared migration — 2026-11-03

`20261103155717_pin_timestamp_helper_search_path.sql` is the fifth, append-only migration: one `ALTER FUNCTION public.touch_updated_at() SET search_path = pg_catalog`. No tables, records, grants or bindings change. Tenants/profiles retain transaction timestamps; memberships/settings retain the separate monotonic revision helper. [R2 verification/deployment notes](R2_TIMESTAMP_HARDENING.md) distinguish fresh/transactional-upgrade CI from hosted deployment. Read-only hosted history on this date still contains only the four earlier versions; the fifth has not been deployed.

## Prepared R3 migration — 2026-11-11

`20261111051704_direct_rpc_write_quotas.sql` adds private `app_private.rpc_write_windows` security metadata (auth-user FK with delete cascade, actor/scope PK, bounded non-null timestamp arrays, RLS and no client policies/grants), an immutable private policy function and a fixed-search-path trigger on audit insertion. Audit/business data and existing RPC bodies/owners/signatures/grants remain unchanged. Recent audit usage seeds upgrade counters transactionally. See [deployment/rollback and retention notes](R3_DIRECT_RPC_BACKSTOP.md); hosted migration status is unchanged.
