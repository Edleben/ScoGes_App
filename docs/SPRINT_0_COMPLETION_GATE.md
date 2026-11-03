# Foundation completion gate

Assessment: **2026-11-01 — owner kept the gate open for remediation**. Six technical milestones are delivered at 100%; Sprint 0 stays `in_progress` until explicit acceptance is recorded. Sprint 1 remains planned at 0%. This is a development-foundation gate, not production certification or authorization to activate a later sprint.

The owner declined the proposed R1–R7 deferrals. Use [the remediation backlog](SPRINT_0_REMEDIATION.md) before requesting renewed closure acceptance. All items remain open; no risk waiver, merge, deployment or Sprint 1 activation is implied.

## Current review and evidence

[PR #7](https://github.com/Edleben/ScoGes_App/pull/7) is merged as `6a76c436b5d7d2eb4efe50ea3895142412731540`. Its final-head CI passed 98 unit/component tests, 6 safety tests and 32 isolated Chromium cases, with no skipped/flaky results. Real hosted FR/EN confirmation/recovery/invitation receipt and completion, controlled negative-link checks and audited SMTP failure are documented in [email evidence](SPRINT_0_EMAIL_VALIDATION.md).

The closure candidate is [PR #8](https://github.com/Edleben/ScoGes_App/pull/8), with [current required checks](https://github.com/Edleben/ScoGes_App/pull/8/checks). All required checks must execute on its final head; prior green runs do not certify a later commit. Actual SHA/run links/totals are recorded in that PR after execution. See [validation history](SPRINT_0_VALIDATION.md), [both tracker records](PROJECT_TRACKER.md) and the [closure risk/acceptance register](SPRINT_0_CLOSURE.md).

## Closure checklist

| Gate                          | Assessment / evidence required                                                                                                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bilingual foundation          | Delivered: authenticated FR/EN onboarding, shell/dashboard/tracker, safe errors, locale navigation and document language; refresh full Chromium on closure head                                          |
| Real email lifecycle          | Delivered: actual receipt/link completion, expired/reused-link rejection, password/membership state and failed-delivery audit; retain the hosted-versus-isolated limits in the email matrix              |
| Quality/build/security        | Final-head lint, generated route types, typecheck, unit/contract and CI safety tests, changed-file formatting, production build, dependency audit and secret scan must pass                              |
| Migration/RLS/audit           | Final-head CI applies every migration fresh; tests real database roles, tenant isolation, permission denial, stale writes and atomic audit rollback; hosted refresh must leave no schema/fixture changes |
| Concurrency/Chromium          | Disposable CI verifies independent-connection last-administrator races/audit counts and the complete browser suite; zero failures, skips and flaky results                                               |
| Documentation/risk acceptance | UI and Markdown tracker/checkpoint agree; shared handoff is current; owner explicitly accepts technical closure and R1–R7 dispositions in PR #8                                                          |

Evaluate the full [Sprint 0 Definition of Done](prompts/SPRINT_0_MASTER_PROMPT.md). The [risk register](SPRINT_0_CLOSURE.md) identifies the shared rate-limit abstraction/header-policy deviation rather than quietly claiming complete production security. Existing hosted Auth limits and SQL invitation throttles remain in force. New security/data-integrity failures always block closure; documented debt does not authorize weakening safeguards.

## Transition procedure

1. Complete final-head checks and review PR #8. Record explicit owner acceptance of Sprint 0 and residual-risk dispositions; a request to verify, SMTP readiness, merged email PR or green badge alone is not acceptance.
2. After acceptance, record review/merge evidence and set Sprint 0 to `done` in both trackers through a protected, freshly validated PR. Keep the six milestones at 100%, preserving dated evidence. Until that decision, both trackers intentionally remain `in_progress` at 100%.
3. Stop at Sprint 0. Obtain separate explicit activation of the [bounded Sprint 1 proposal](prompts/SPRINT_1_MASTER_PROMPT.md) and resolve its business decisions before affected slices.
4. Production deployment, hosted migration changes and pilot readiness require their own authorization and evidence. Do not infer them from closure.
