# Authorized hosted migration deployment — 2026-11-11

Status: **both reviewed migrations applied and post-deployment regressions passed** on the Supabase project configured in ignored `.env.local` (project reference `jlaufrjmjjheisdqkkao`). Owner explicitly authorized: “Apply both reviewed migrations now.” No credentials, connection URLs, test identities or tokens are recorded here.

## Reviewed source and scope

[PR #10](https://github.com/Edleben/ScoGes_App/pull/10) is merged into main at `fc90421e739451eb4d14b6b6e72a340f4a67f9be`; [merge-commit CI](https://github.com/Edleben/ScoGes_App/actions/runs/43026311448) passed. The clean mandated feature branch was fast-forwarded to that reviewed commit before deployment. Local SQL was compared with the merged bytes and checked against these SHA-256 values:

| Migration                                             | Merged-source SHA-256                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `20261103155717_pin_timestamp_helper_search_path.sql` | `f694a9f8c1bd40822c70a28b447c0bc70e425420c8e788b50819259f7b3c1887` |
| `20261111051704_direct_rpc_write_quotas.sql`          | `cfb9ecc2c561c3765fcaed0c1f86bdf216a359fbe36d6ab5978ee2ac6a659bde` |

Preflight verified matching configured API/database project identity, certificate/hostname-verified TLS, the four expected applied versions, absent quota namespace/table and no audit-table lock waiters. Only the two explicitly reviewed pending versions were accepted; no migration reset or history repair was used.

## Transaction and preservation checks

Both migrations and their new history rows were committed in **one transaction**, with a deployment advisory lock, migration-history/audit-table locks, a five-second lock timeout and 30-second statement timeout. History records include version, name and reviewed SQL statements. PostgreSQL schema-cache reload was notified transactionally.

Before commit, fingerprints confirmed unchanged existing tenants, profiles, settings, memberships, role assignments, invitations and audit rows. Existing public RPC OIDs, bodies, owners, ACLs, argument/return types and security modes were preserved; existing trigger bindings were unchanged. Only the intended helper configuration and new private quota objects/history changed.

Post-commit history now contains six versions in order:

1. `20260917000100`
2. `20261028013153`
3. `20261028022102`
4. `20261030185852`
5. `20261103155717`
6. `20261111051704`

The timestamp helper remains SECURITY INVOKER with `search_path=pg_catalog`. The quota trigger is enabled on audit insertion, its table has RLS/no client policies, and authenticated/anon access to the private schema/table/functions remains denied. Existing business authorization was not replaced by a privileged application credential.

## Executed hosted verification

- Transaction-local synthetic SQL probe: private client access denied; five direct tenant creations allowed; sixth rejected with `PT429 / rpc_rate_limited`; exactly five tenants/audit/quota entries before rollback, zero probe records afterward.
- Actual authenticated PostgREST probe: five direct writes returned HTTP200, sixth HTTP429 with the fixed safe code/message. Counts confirmed atomic mutation/audit/quota behavior. The unique synthetic account was signed out globally and deleted; exact synthetic tenants/audit/private-quota rows were removed, with absence verified. No real email was sent and no customer records were targeted.
- `pnpm check:supabase`: Auth and membership-schema HTTP200.
- `pnpm test:db`: invitation lifecycle, administration/transactional audit and database authorization assertions passed under the migrated schema; all fixtures and test-only DDL rolled back.
- Production-mode hosted-backed Chromium: **20 passed, 0 failed, 0 skipped, 0 flaky**; French/English auth/onboarding/administration/invitations, stale writes, last-admin safeguards and browser CSP checks.

The destructive/local upgrade and committed race fixtures were not run against hosted Supabase. Their prior isolated CI evidence remains in [the backstop report](R3_DIRECT_RPC_BACKSTOP.md).

## Advisor limitation and remaining gates

The Supabase connector denied permission to run this project's full security-advisor scan. Direct SQL verified the targeted immutable helper path and the new fixed-path private quota/RLS/privilege controls; a full hosted advisory refresh is **not claimed**. An authorized project owner should refresh the dashboard advisors and record any remaining findings.

R2's code/configuration fix is deployed and verified; the full advisor refresh remains pending. R3's direct successful-write backstop is deployed and verified, while Vercel ingress/HTTPS/environment checks and exercised quota/outage monitoring remain open. Rejected-request/DDoS perimeter protection, Redis Free-plan availability/fairness and the R4 recovery/rollout/UAT work remain separately tracked. This deployment does not close R3 or the owner-controlled Sprint 0 gate, authorize public pilot use, purchase a plan, merge another PR or activate Sprint 1.

## Recovery and next step

Migration history remains append-only. No financial source records were changed. Use reviewed fix-forward migrations for defects; disabling the quota trigger, clearing counters or removing the search-path pin would reduce security and requires explicit review. This task did not claim a backup/restore drill or RPO/RTO acceptance.

Next recommended work is bounded R4 recovery/deployment/monitoring planning, with owner-approved recovery objectives and an isolated restore target before a restore drill. Deployment evidence/status changes remain on `edwakson/ScoGes_App` for PR review; main is never pushed directly.
