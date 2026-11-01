# Sprint 0 remediation backlog — R1–R7

Checkpoint: **2026-11-01**. Owner decision: **“Keep the gate open for remediation.”** The previously proposed deferrals are **not accepted**. Sprint 0 remains `in_progress`; Sprint 1, deployment and hosted changes are not authorized by this record. The six delivered tracker milestones retain their historical 100% score; that score does not include completion of this remediation backlog.

This is the actionable follow-up to the [closure risk register](SPRINT_0_CLOSURE.md) and [completion gate](SPRINT_0_COMPLETION_GATE.md). All R1–R7 items are **open**, with no assigned individual or promised date. Owners below are responsible functions pending assignment. Severity is an engineering assessment except R1's reported audit rating; priority describes work order, not a claim of active exploitation. Evidence is dated and must be refreshed before implementation.

## Priority and release gates

| ID  | Severity / priority                                               | Responsible function            | Pilot/production gate                                                                  |
| --- | ----------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------- |
| R1  | Moderate (audit) / P1, next bounded slice                         | Engineering + security          | Patch/reassess before pilot                                                            |
| R2  | Low–moderate / P1, next bounded slice                             | Database + security             | Reviewed fix and deployment verification before pilot                                  |
| R3  | High under public exposure / P1, begin now                        | Application + security          | Blocks public preview/pilot pending implemented, tested controls                       |
| R4  | High operational impact / P1 planning now, execution before pilot | Operations + product + security | Blocks pilot/production                                                                |
| R5  | Low / P3                                                          | Engineering                     | No independent release blocker; changed-file formatting must pass                      |
| R6  | Low UX; moderate evidence gap / P2                                | Product + application + QA      | Pre-pilot resilience/usability review; field reset alone is not a hard release blocker |
| R7  | Moderate delivery risk / P2                                       | Identity + operations           | Deployment delivery/quota monitoring and bounce-handling evidence before pilot         |

P1 means the next security/remediation work, not an emergency declaration. There is no documented active incident. Proposed order: address R1's compatible patches and R2's narrow database fix as separate reviewable changes; start R3's threat/control design immediately and implement it before any public exposure. Start R4's operational decisions in parallel only when the owner authorizes that work. Do not replace R3/R4 with easier cosmetic work.

## R1 — Development-tool dependency advisories

- **Status / evidence:** Open. The 2026-11-01 audit reported zero high/critical and three moderate development-only advisories: two `@vitest/mocker`, one `minimatch`. This is a dated result, not a live audit.
- **Impact:** Test/development tooling may permit code injection, path traversal or resource exhaustion under advisory-specific conditions. Development-only does not mean harmless, especially for CI that processes untrusted contributions.
- **Existing mitigation:** No reported runtime dependency findings at that checkpoint; read-only CI permissions, isolated services and the existing high/critical audit gate. These do not eliminate the moderate findings.
- **Remediation:** Refresh advisories and resolved dependency paths. Apply the smallest compatible Vitest/mocker patch (documented fixed line >=5.0.3). Check upstream fixes for minimatch (documented >=11.0.1); do not force a breaking major across consumers. Document a real compatibility blocker if a safe resolution is unavailable.
- **Acceptance / verification:** No affected vulnerable resolutions remain, or an individually documented owner-approved exception exists. Frozen install, full unit/contract/CI-safety tests, lint/types/build, dependency audit and Chromium regression pass on the resulting PR head. Keep lockfile changes reviewable; do not weaken the audit threshold.
- **Deferral:** Previously proposed for controlled development only; **not accepted**. A moderate rating does not require halting all local development, but this is a small, high-value candidate to fix now.

## R2 — Timestamp trigger helper search path

- **Status / evidence:** Open. `public.touch_updated_at()` has no pinned search path. Hosted readback on 2026-11-01 found `security_definer=false`; the body assigns `now()` to `new.updated_at`. Existing foundation migrations and security-advisor output identify the helper.
- **Impact:** Mutable resolution context is avoidable database hardening debt; current evidence does not establish a privilege-escalation exploit.
- **Existing mitigation:** Security-invoker trigger helper, small body, existing RLS/permission controls and CI security-advisor checks. No error-level advisor finding is permitted by CI.
- **Remediation:** Add a minimal append-only migration pinning an appropriate search path and qualifying any needed references. Preserve trigger behavior, grants and migration history. Do not rewrite the original migration or change `SECURITY INVOKER` to definer.
- **Acceptance / verification:** Advisor warning resolved; new installs and an upgrade from the current chain both work; tenant/settings/profile/membership timestamp updates still work. RLS, stale-write revisions, transactional audit, last-administrator races and Chromium checks pass. Include deployment/rollback notes; apply to hosted only under explicit authorization.
- **Deferral:** Limited current exposure supported a development-only proposal; **not accepted**. The narrow fix is worth doing now, with deployment treated separately.

## R3 — Shared abuse protection and browser security policy

- **Status / evidence:** Open. No shared application rate-limit abstraction or complete deployment CSP/security-header policy. Existing SQL invitation controls enforce serialized issuance, 20 invitations per actor/hour and a one-minute pending-recipient cooldown; hosted Auth also throttles its endpoints.
- **Impact:** Public exposure can allow resource abuse and leaves browser defense-in-depth incomplete. Existing invitation limits do not prove general protection of onboarding, callbacks or other application actions.
- **Existing mitigation:** Authentication, live permissions/RLS, invitation throttles, safe errors, allowlisted redirects and existing auth cache/referrer controls. Retain all of them.
- **Remediation:** Inventory sensitive entry points and deployment topology. Define tenant/user/IP keys using trusted identity/proxy data, bounded storage/retention, multi-instance behavior, failure policy and user-safe FR/EN feedback. Reuse existing infrastructure when sufficient; do not add a broker/provider without need. Design CSP/headers around actual Next.js/auth requirements; verify policy before enforcement.
- **Acceptance / verification:** Unauthorized and cross-tenant requests remain denied; limits hold across concurrent requests and instances; spoofed client identifiers cannot evade limits. Tests cover burst/retry/dependency-failure behavior without leaking PII or blocking legitimate recovery. Browser checks verify headers, scripts, navigation, callbacks and both locales; no blanket CSP relaxation or hydration suppression. Record operational tuning and alerting.
- **Deferral:** Only controlled development had been proposed; **not accepted**. Begin this now and complete it before public preview/pilot. Do not present an in-memory single-process limiter as production multi-instance protection.

## R4 — Recovery, deployment and pilot readiness

- **Status / evidence:** Open/unverified: restore drill, RPO/RTO, deployment/environment/monitoring runbook, broader mobile/accessibility/UAT.
- **Impact:** Recovery time/data loss and incident response are unproven; real users may face usability or accessibility barriers.
- **Existing mitigation:** Foundation quality/security tests and isolated CI. These do not demonstrate backup recoverability, operational monitoring or pilot acceptance.
- **Remediation:** Agree RPO/RTO, retention and ownership; document environment separation, deployment/rollback, access control, monitoring and escalation. Restore an approved backup into an isolated environment and measure results. Execute keyboard/mobile/accessibility review and bounded pilot UAT.
- **Acceptance / verification:** Dated restore evidence meets agreed objectives and verifies data integrity without exposing secrets; deployment/rollback and alert/escalation procedures are exercised; product owner records UAT/accessibility findings and dispositions. Never rehearse against or reset a real database without explicit authorization.
- **Deferral:** Full execution can be scheduled around the intended pilot, but production/pilot is blocked. **No deferral has been accepted.** Start planning now; do not claim infrastructure capability from app tests.

## R5 — Legacy formatting debt

- **Status / evidence:** Open. Full `pnpm format` reported 19 existing files on 2026-11-01, including canonical documents and generated lockfile. Changed-file formatting passed.
- **Impact:** Inconsistent presentation and noisier maintenance; no functional defect is established by formatting alone.
- **Existing mitigation:** Changed-file ratchet, lint, types and review.
- **Remediation:** Recheck the file list; group small formatting-only changes. Preserve canonical specification wording and generated-file ownership. Keep formatting separate from security fixes.
- **Acceptance / verification:** Each chosen batch passes formatter/diff checks and required CI; no semantic changes. Record exclusions deliberately rather than disabling checks or rewriting requirements.
- **Deferral:** Low security/business impact makes this the lowest priority; the owner has not accepted a closure waiver. It should not delay R1–R4 remediation.

## R6 — Onboarding value retention and resilience evidence

- **Status / evidence:** Open. Onboarding resets edited values on validation failure. Global-error/dependency presentation is tested in both locales at component level; a live hosted outage drill was not performed.
- **Impact:** Re-entry frustration and incomplete evidence for real dependency outages. These are separate subitems: R6a UX retention and R6b resilience verification.
- **Existing mitigation:** Safe FR/EN validation, tested onboarding/duplicate-slug paths and component error/retry coverage.
- **Remediation:** Preserve validated non-secret input on unsuccessful submissions without retaining passwords/tokens. Add bounded disposable-environment failure injection for relevant Auth/database/SMTP paths; specify timeout and retry behavior. Do not interrupt hosted services merely to prove an error screen.
- **Acceptance / verification:** FR/EN invalid/duplicate/transient-failure cases retain appropriate fields, permit correction/retry and never create duplicate tenants or unsafe success. Failure checks leave no partial business/audit state, expose no secrets and clean up fixtures; full browser regressions pass.
- **Deferral:** Field retention can follow immediate security work; live resilience evidence must be reviewed before pilot. **No deferral is accepted.** Avoid treating absence of a hosted outage drill as proof of a known availability failure.

## R7 — Email operations and evidence limits

- **Status / evidence:** Open. Controlled hosted mailboxes and isolated FR/EN tests verified receipt/completion, replay/forced-expiry rejection and immediate delivery failures. Async bounces, universal provider delivery and naturally elapsed expiry are not certified; see [email matrix](SPRINT_0_EMAIL_VALIDATION.md).
- **Impact:** Real recipients may experience delayed/missing mail, bounces or quota exhaustion after SMTP acceptance.
- **Existing mitigation:** Real received-link evidence, safe failure states, bounded TLS SMTP adapter, delivery-state/audit checks and exact fixture cleanup. SMTP acceptance alone remains insufficient.
- **Remediation:** Establish deployment quota/delivery monitoring, safe bounce classification and an administrator recovery/runbook path. Specify what delivery status means; do not equate SMTP acceptance with inbox receipt. Use approved controlled recipients for representative provider checks and a naturally elapsed expiry check where worthwhile.
- **Acceptance / verification:** Demonstrate safe handling/escalation of an accepted-then-bounced message, quota/transport errors and delayed delivery; preserve recipient privacy and one-use link behavior. Record representative-provider coverage and residual limits. Universal deliverability is not a realistic completion criterion; no new mail/settings changes without relevant authorization.
- **Deferral:** Operations work can follow the immediate security slices, but must be evidenced before pilot. **No deferral is accepted.** Existing successful email journeys remain valid; the gap is operational breadth.

## How an agent resumes or closes an item

1. Read AGENTS, active Sprint 0 scope, this backlog and linked evidence; inspect current code, Git/PR state and external configuration privately. Revalidate dated advisories before choosing patches.
2. Obtain the owner's bounded implementation direction where not already authorized; propose the smallest safe change. Documentation here does not authorize deployment, new infrastructure, mail sends or a later sprint.
3. Keep each remediation reviewable on `edwakson/ScoGes_App`. Preserve RLS, permissions, audit atomicity, last-admin protection and append-only migrations.
4. Update the item's status only with actual commit/PR/run evidence, responsible owner and verification limits. Never infer accepted risk from a green check or merge of unrelated work.
5. Reconcile the closure register, tracker/handoff and completion gate. Rerun appropriate checks on the final remediation/closure head. Request renewed Sprint 0 acceptance after required remediation or individually approved dispositions; stop before Sprint 1.
