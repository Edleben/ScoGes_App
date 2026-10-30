# Data Model

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
