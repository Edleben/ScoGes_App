# R2 timestamp-helper hardening — 2026-11-03

Status: **implementation prepared; validation/review and hosted deployment tracked separately**. R2 is not closed on the hosted project. R1 remains partial, R3–R7 remain open and Sprint 0 acceptance is unchanged. This task does not authorize hosted deployment or Sprint 1.

## Smallest change

Migration [20261103155717_pin_timestamp_helper_search_path.sql](../supabase/migrations/20261103155717_pin_timestamp_helper_search_path.sql), created by the pinned Supabase CLI, contains one configuration change:

```sql
alter function public.touch_updated_at() set search_path = pg_catalog;
```

The existing body needs only the trusted built-in `now()` and trigger records. An explicit `pg_catalog` path prevents caller-selected schemas from affecting that lookup. `ALTER FUNCTION` retains the function object, source, owner, invoker execution, privileges and bindings; no table data or RLS/permission rule changes. See [PostgreSQL ALTER FUNCTION](https://www.postgresql.org/docs/current/sql-alterfunction.html) and [Supabase search-path advisor](https://supabase.com/docs/guides/observability/advisors?queryGroups=lint&lint=0011_function_search_path_mutable).

Effective bindings after the existing administration migration remain:

| Table           | Trigger helper                      | Behavior preserved                                                          |
| --------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| tenants         | `touch_updated_at()`                | Transaction timestamp                                                       |
| profiles        | `touch_updated_at()`                | Transaction timestamp                                                       |
| memberships     | `advance_administration_revision()` | Strictly advancing revision, including repeated writes/future old timestamp |
| tenant_settings | `advance_administration_revision()` | Same monotonic revision contract                                            |

The hardening does not rebind memberships/settings to the older helper or change administrative no-op handling.

## Verification design and boundaries

The ordinary CI job applies all five migrations from scratch and runs security advisors, existing RLS/authorization, invitation and transactional audit assertions, administrator concurrency and full Chromium. The isolated `pnpm test:db` path additionally invokes [timestamp-hardening.mjs](../scripts/tests/timestamp-hardening.mjs):

1. **Fresh installation:** verifies the already-migrated helper is pinned/invoker; checks exact trigger bindings, all four timestamp behaviors and a hostile caller search path with a synthetic `public.now()` that throws if reached.
2. **Transactional upgrade:** restores only the helper's previous unset search-path configuration, verifies that starting state, inserts synthetic records, applies the new migration, then compares function OID/source/owner/ACL/security attributes and all fixture data before/after. Repeats behavior/shadowing assertions. This models the exact previous helper configuration on the otherwise unchanged four-migration schema; it is not a separate historical database restore or hosted deployment.
3. Both scenarios roll back all synthetic data, the shadow function and temporary DDL. The fresh scenario runs first, so the upgrade setup cannot hide a broken fresh migration.

The helper requires both `CI_ENFORCE_INTEGRATION=1` and `DATABASE_TEST_LOCAL=1` plus a loopback PostgreSQL URL **before connecting**. Negative CI tests reject missing flags and hosted/deceptive hostnames. Never enable these scenarios against a hosted database or a tunnel to one. Ordinary hosted-mode `pnpm test:db` retains its existing rolled-back checks and does not apply or simulate R2.

Docker is unavailable locally; SQL/advisor/concurrency/browser results must come from disposable GitHub CI. Local guards/lint/types/unit/build are separate evidence. Exact commit/run links and final results belong in the review PR after execution; pending checks are not predeclared successful.

## Hosted checkpoint and deployment plan

Read-only verified-TLS checks on **2026-11-03** confirmed the `.env.local` project identity, the same four applied versions (20260917000100, 20261028013153, 20261028022102, 20261030185852), `prosecdef=false`, no helper `proconfig`, and the bindings above. No hosted mutation or migration was performed.

After explicit deployment authorization and validated PR review/merge:

1. Recheck the configured project identity privately and migration history. Confirm that the pending set is exactly the reviewed new migration; do not reset or repair hosted history to force agreement.
2. Apply through the established verified-TLS migration procedure with the proper deployment role. The migration requires ownership of the helper; do not broaden application privileges to make deployment work.
3. Verify the new history entry, `proconfig` containing `search_path=pg_catalog`, unchanged invoker execution/ACL/trigger bindings and disappearance of this helper's mutable-path advisor finding. Preserve any unrelated findings for separate triage.
4. Run approved post-deployment regression checks and record actual evidence. Only then consider the hosted portion of R2 resolved; Sprint 0 still needs its other remediation and explicit owner acceptance.

## Rollback and recovery

No row-data migration or restoration is required. Keep migration history append-only. Any reversal must be a reviewed forward migration; resetting the path to the previous unset value would reopen R2 and requires an explicit security decision. Do not automatically remove the pin, downgrade invoker security, rewrite applied files or reset a real database.
