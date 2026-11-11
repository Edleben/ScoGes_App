# R4 release, rollback and incident runbook — planning

Status: **not executed/configured**. Read [the R4 decision/monitoring plan](../R4_RECOVERY_DEPLOYMENT_MONITORING_PLAN.md). Main remains PR-only; required checks stay mandatory. No deployment, DNS change, secret rotation, paid plan or real notification is authorized by this template.

## Environment and release map

Complete this map with metadata/secret references only before deployment:

| Environment       | App/team/project/domain                                    | Supabase                                                     | Redis / mail / monitoring                                         | Readiness                                                                 |
| ----------------- | ---------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Local             | Existing local application; task tests use a separate port | Configured hosted project used for approved synthetic checks | Local server-only configuration; avoid real mail                  | Existing test evidence, not production isolation                          |
| Ordinary CI       | Disposable Linux runner / local services                   | Disposable loopback Supabase                                 | Disposable loopback Redis/SMTP; sanitized artifacts               | Verified pipeline design; external package DNS failures remain observable |
| Protected preview | Exact Vercel account/team/project/URL TBD                  | Separate approved nonproduction backend                      | Separate Redis and mail sink; no production keys on arbitrary PRs | Unverified                                                                |
| Pilot/production  | Exact Vercel target/region/domains TBD                     | Classify/approve the actual intended production project      | Approved secrets/alerts/response roster                           | Not authorized or verified                                                |
| Restore drill     | Approved disposable target TBD                             | Must differ from source                                      | Isolated mail/jobs/Redis; restricted outbound effects             | Not approved/executed                                                     |

Do not classify the currently configured project as staging or production solely from its name or `.env.local`. Record that ownership decision and data classification. Existing hosted project identity is in the deployment evidence; never substitute a global connector project.

## Pre-release and controlled preview

1. Confirm approved team/project/commit/environment, owner, scope, data classification and budget. Check the latest PR/head and required gates; old CI counts cannot approve a new release. Confirm backups, tested recovery access and known-good compatible artifacts before a schema release.
2. Inventory environment **names/presence/scopes**, never raw values. Required references include Supabase public configuration, server-only Redis URL/token, SMTP settings, canonical app URL and `RATE_LIMIT_INGRESS=vercel`. Vercel must supply its platform identity; arbitrary client headers or a manually marked non-Vercel server are not trusted ingress. Administrative Supabase/database credentials stay outside application authorization.
3. Verify separate preview credentials/data, private authentication/mail redirects and protected URLs/aliases. Check preview protection from an unauthenticated browser, including generated/older URLs and custom domains as applicable. Confirm the actual plan supports selected controls; do not claim protection from a label alone.
4. Produce a reviewed release manifest: Git SHA, build/deployment ID, environment references, schema/migration versions, test evidence, backward compatibility, rollback candidate and operator. Avoid tokens in URLs/logs/artifacts.
5. Treat app deployment and database migration as distinct release steps. Append-only expand-first changes precede compatible code; do not mutate applied history or run production migrations on every PR push. Preflight exact history/project/SQL checksums and use bounded transactional locking for reviewed migrations. Validate grants, RLS, triggers and audit before opening writes.
6. Run actual deployed FR/EN auth/session/callback/onboarding/admin smoke, document-language/navigation/error tests, quota/outage behavior and negative tenant/permission checks. Use controlled identities and restricted diagnostics; no authenticated screenshots/traces containing secrets or PII. Verify actual Vercel forwarding-header provenance and spoofed-header rejection, HTTPS/CSP/HSTS/cache/referrer controls.
7. Review deployment health and delivered alert evidence, obtain release approval, then promote the intended artifact/environment through the approved flow. Verify the final domain after cutover; preview tests alone do not validate production configuration.

Vercel documents different promotion behavior for staged production versus preview artifacts; do not assume a promoted preview is the same tested production build/environment. Verify the current workflow and plan capabilities before a release. [Promotion documentation](https://vercel.com/docs/deployments/promoting-a-deployment), [deployment protection](https://vercel.com/docs/deployment-protection).

## Compatible application rollback

1. Incident owner identifies the failing release/environment and stops further promotion. Preserve a sanitized timeline, release IDs, health and error categories. Avoid repeated deployment attempts while the cause is unknown.
2. Verify the prior artifact is known-good **and compatible with the current database/security controls and environment**. Reverting application code must not remove quota/RLS enforcement or restore revoked access. New migrations are not automatically undone by an app rollback.
3. Use the approved rollback mechanism for the exact target and record operator authorization. Do not rebuild an arbitrary old branch, force-push main, disable required CI, remove the quota trigger, clear counters or undo the helper pin as a shortcut.
4. Verify deployed URL/aliases, schema compatibility, login/callbacks, FR/EN journeys, permissions/audit/quota and alerts after rollback. Check provider auto-promotion/branch assignment state; rollback may change it. Document and re-enable normal releases only through a reviewed decision.
5. If database corruption/data loss is suspected, use the approved recovery plan/isolated restore first; an in-place restore or destructive reversal needs explicit impact/recovery authorization. Reconcile post-backup access changes and consumed links before reopening service.

## Alert delivery and incident response

Configure no real notification destination until its owner consents. A dashboard chart or logged event is not proof an alert reaches a person.

1. Adopt the main plan's proposed thresholds only after owner review. Record source/collector, sanitized payload, environment/release labels, trigger window, primary/backup route, coverage and escalation timer. Proposed acknowledgement target: 15 minutes during the agreed coverage window; not an established SLA.
2. Exercise each route safely in preview/drill scope: simulated provider failure, missing configuration, stale backup, quota pressure, controlled auth/callback error and unavailable endpoint. Do not take down live Redis/Auth, consume production quota deliberately, or send real-user recovery emails to test paging.
3. Verify event collection, delivered notification, human acknowledgement and backup escalation. Keep an acknowledgement/time receipt with sensitive content removed. Until then mark the route untested. Define alert recovery/closure and noise handling separately from failure detection.
4. Existing `security.rate_limit.unavailable` logs cover provider-result failures, not all early configuration/ingress errors. Functional readiness checks must detect fail-closed login with otherwise-healthy HTTP200 pages. Audit request IDs are not yet universal end-to-end trace IDs. Confirm actual telemetry before relying on correlations or a Sentry DSN.
5. Keep credentials/cookies/reset and invitation links, raw emails/IPs and customer payloads out of logs/traces/alerts. Use allowlisted event/status/duration/release fields. Existing Redis identifier analytics remain disabled; define access/retention/scrubbing before enabling any collector.

| Incident                              | Initial action                                                                                                                                            | Forbidden shortcut / required recovery proof                                                                                                                |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Redis outage/quota/configuration      | Identify scoped environment, inspect provider usage/status and safe events, notify primary/backup; owner chooses approved capacity/configuration recovery | Preserve fail-closed limits and DB quotas; no shared secret exposure, automatic paid upgrade or unbounded fallback. Prove authenticated recovery            |
| Auth/SMTP failure                     | Separate Auth quota/confirmation delivery from application invitation SMTP; use a controlled mailbox and provider evidence                                | Never declare inbox receipt from SMTP auth/acceptance alone; avoid reset-email spam                                                                         |
| Backup stale/corrupt/inaccessible     | Declare recovery-readiness incident; identify last verified point/key and accountable operator                                                            | No success label for incomplete exports; owner decides safe containment using an actually available procedure, not an invented maintenance switch           |
| Unexpected access or grant drift      | Contain affected access/writes, retain safe evidence, compare reviewed permissions/migration state                                                        | No client-only authorization fix or unaudited privilege change; prove tenant negatives and audit invariants                                                 |
| Release/CI external dependency outage | Diagnose the failing install/network phase and retry boundedly on a healthy runner when justified                                                         | Never skip Chromium/security/database gates or release unvalidated code; a previously approved compatible rollback is a separate controlled incident action |

## Foundation UAT and release acceptance record

Plan keyboard-only navigation/focus/form errors, readable loading/empty/denied/outage states, French/English navigation/document language and mobile widths around 360/390/768px plus desktop. Record actual viewport/browser/role/flow, expected/observed behavior, defect severity and owner disposition; target WCAG 2.2 AA intent without claiming certification.

Use only implemented login, recovery/invitations, onboarding, dashboard/tracker, users/roles/status and settings journeys. Test two controlled tenants, administrator and restricted roles, stale forms, last-admin protection and failure states. Parent/student/billing/payment workflows are future sprint scope, not foundation UAT evidence. Pilot enrollment/communications need explicit owner/participant authorization.

Evidence template: release SHA/deployment/environment; reviewed schema compatibility and backup point; preflight and post-cutover outcomes; actual rollback timing/result; safe alert delivery/ack/escalation; FR/EN/mobile/UAT defects; owner approval and residual risks. All execution fields are pending until a drill/release occurs. Do not mark R3/R4/Sprint 0 done from this runbook's existence.
