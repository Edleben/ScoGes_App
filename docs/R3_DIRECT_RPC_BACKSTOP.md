# R3 — Direct RPC write backstop

Checkpoint: 2026-11-11. Owner authorized this bounded follow-up. Implementation is prepared on `edwakson/ScoGes_App` for PR #10; database/upgrade/concurrency and final-head CI results are pending. Do not merge, deploy migrations, activate Sprint 1 or mark Sprint 0/R3 closed from this document.

## Goal and boundary

The application Redis adapter cannot intercept direct Supabase Data API calls. An append-only migration, `20261111051704_direct_rpc_write_quotas.sql`, adds a database backstop to the existing transactional audit-write boundary. Existing RPC signatures, bodies, owners, EXECUTE grants, authorization/tenant checks, last-administrator protection, stale-write handling and audit records are unchanged. No Redis credential or external HTTP call is introduced into PostgreSQL.

Every current targeted mutation emits its matching audit event inside its business transaction. A BEFORE INSERT trigger checks the verified `auth.uid()` against the event actor, locks a private per-actor/scope quota row, prunes expired timestamps and either records the write or raises `PT429 / rpc_rate_limited`. PostgREST maps that SQLSTATE to HTTP 429. Business mutation, quota update and audit insertion commit or roll back together. No-op and failed/rolled-back transactions consume no database quota; Redis still limits application attempts before side effects.

| Audited operations                                      | Per-user rolling quota across tenants                               |
| ------------------------------------------------------- | ------------------------------------------------------------------- |
| Tenant creation                                         | 5 successful writes / hour                                          |
| Roles, deactivation/revocation, settings (shared scope) | 60 / 10 minutes                                                     |
| Current and legacy invitation issuance                  | 20 / hour, plus existing SQL limit/cooldown                         |
| Invitation acceptance                                   | 20 / 10 minutes; second role-assignment audit is not double-counted |
| Delivery status recording                               | 40 / hour, shared between sent/failed events                        |

The delivery ceiling allows the normal 20 issuances/hour with headroom for recording results, while bounding direct repeated delivery recording. Other thresholds match the approved application limits. Existing invitation issuer rechecks, verified-recipient acceptance, one-use token digests and audit atomicity remain active.

## Privacy, privileges and failure behavior

`app_private.rpc_write_windows` is outside the exposed API schema, has RLS with no client policies, and denies schema/table/function access to PUBLIC/anon/authenticated. A tightly scoped SECURITY DEFINER trigger with an empty search path writes this security metadata only; no new callable business API or service-key bypass exists. The immutable policy mapper is private and invoker-mode. Actor/quota values cannot be selected by RPC/form arguments.

The account UUID is necessary database-local attribution and deletion linkage; no IP, email, invitation/session token, credential or financial fact is stored in counters. There are at most five rows per actor, with quota-bounded arrays (at most 145 timestamps total under current policies). Expired stamps are pruned on the next write; inactive rows remain bounded until their auth user is deleted, which cascades counter deletion. No cron or unbounded event table is introduced.

Clock time is taken after the row lock and never moves behind retained usage. Counter failure, constraint failure or quota exhaustion aborts the enclosing mutation. Errors contain no quota identity, cross-tenant data or provider payload. The app classifies only the exact PT429/code-message pair and reuses safe FR/EN feedback. Sign-out and ordinary reads are unaffected. A lost response or retry is not permission to bypass either layer.

## Migration and rollout

Migration history is append-only. Trigger creation takes a SHARE ROW EXCLUSIVE audit-table lock, held to the end of the migration transaction; run the entire migration transactionally in a controlled deployment window. The trigger is installed before seeding, excluding concurrent audited writes from the history snapshot. Recent protected audit events seed only the newest quota-sized windows, so existing usage does not receive a reset on upgrade. Audit/business records and existing functions/grants are not rewritten. A one-time audit-history scan is required; assess volume and lock time before deployment. An unexpected existing `app_private` namespace causes a safe migration failure for investigation.

Hosted Supabase has not received this migration. After PR review and explicit deployment authorization, inspect migration history and namespace conflicts, apply the reviewed chain (including independently pending R2 where appropriate), verify grants/RLS/trigger/HTTP429 behavior and run post-deployment regression. Older application code remains compatible with the unchanged RPC contracts. Prefer fix-forward for any defect; removing/disabling the security trigger or clearing counters is a security-reducing rollback requiring explicit review. The existing backup/restore gate remains separate.

## Verification plan and executed evidence

Local unit/contract suite: 134 passed; CI safety guards: 10 passed. Remaining executions will be recorded after completion. New SQL fixtures require both explicit isolated-CI flags and a loopback database; they never apply this migration to hosted Supabase. Existing hosted rollback-only tests may still validate the pre-deployment baseline and must not be described as new-backstop evidence.

Disposable CI verifies private privileges/RLS, direct RPC thresholds, cross-tenant actor aggregation, malformed/forged attribution and denied permissions, expiry/clock drift, no-op accounting, storage failure and atomic rollback, current/legacy invitations, delivery results, acceptance and single-use behavior, bounded storage/deletion, recent-history upgrade seeding, and unchanged function identity/grants/data. Independent connections race the final onboarding/admin slots across different tenants. A synthetic confirmed account calls PostgREST directly: five creations succeed and the sixth receives HTTP429 without leaving a tenant/audit row. Only isolated test keys/accounts/rows are cleaned up; raw credentials/tokens/provider errors are never printed.

## R3 disposition

This closes the implementation gap for **successful audited foundation writes once deployed**, rather than converting Redis into a database authorization dependency. Rejected attempts still reach PostgreSQL and can perform work before the audit boundary; a database mutation quota is not a universal request/DDoS limiter. Direct Auth traffic remains subject to Supabase Auth controls. Future RPCs must explicitly extend/retest the audit-action policy; unaudited new mutations must not bypass this boundary.

R3 remains open until the reviewed migration is deployed and verified, Vercel ingress/HTTPS/environment configuration is exercised, and quota/outage monitoring is tested. Shared-NAT fairness, distributed-source abuse, Redis Free-plan exhaustion and operational recovery remain recorded risks. No risk acceptance, pilot approval, merge or Sprint 0 closure is implied.

References: [PostgREST custom HTTP errors](https://docs.postgrest.org/en/v14/references/errors.html), [PostgreSQL trigger locking](https://www.postgresql.org/docs/17/explicit-locking.html), [R3 application layer](R3_ABUSE_AND_BROWSER_SECURITY.md).
