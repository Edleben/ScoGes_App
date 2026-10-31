# Foundation completion gate

Assessment: **2026-10-31 — technical milestones complete; final review/owner acceptance pending.** Sprint 0 remains active at 100% of six unweighted technical milestones. Sprint 1 remains planned at 0%. This is not a production-readiness certificate or activation of the next sprint.

## Current evidence

All six tracker milestones are verified. The owner configured hosted Auth SMTP, after which real French/English confirmation, recovery, invitation delivery/acceptance and invitation replay rejection passed. See [hosted email evidence](SPRINT_0_EMAIL_VALIDATION.md), [validation history](SPRINT_0_VALIDATION.md) and the [tracker](PROJECT_TRACKER.md).

The reviewed application baseline is commit `20cce2793cf298d5e7384f541097340db73d34af`: 96 unit/component/contract tests, 4 CI safety tests, 18 hosted-backed production Chromium tests, and 20 isolated CI browser tests passed. The [baseline PR CI](https://github.com/Edleben/ScoGes_App/actions/runs/41234158801) and push required gates passed. Local reconciliation checks passed (96 unit/component/contract tests, 4 CI safety tests, SQL assertions, 18 browser cases, lint/typecheck/build/format); the [current PR checks](https://github.com/Edleben/ScoGes_App/pull/6/checks) track the review head.

## Closure checklist

| Gate                         | Current assessment                          | Evidence / next step                                                                                                                                                                                |
| ---------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bilingual foundation         | Verified                                    | FR/EN onboarding, shell, dashboard/tracker, safe errors, locale navigation and document language; authenticated browser and component checks                                                        |
| Hosted email lifecycle       | Verified                                    | Real FR/EN confirmation and recovery links completed; invitations submitted through the app, received and accepted; replay denied; exact fixtures cleaned up                                        |
| Foundation regression        | Local refresh passed; see current PR checks | Lint, route type generation, typecheck, unit/contract and CI safety tests, formatting, production build, SQL/RLS/audit checks and full Chromium suite; no skipped/flaky results counted as passes   |
| Migration/security integrity | Baseline verified; safeguards unchanged     | Existing append-only migration chain and tenant/permission/audit controls preserved; isolated CI covers fresh migrations and concurrency. No hosted settings or schema changes by this verification |
| Documentation and acceptance | Final PR review/owner acceptance pending    | Both trackers and handoff agree; review [PR #6](https://github.com/Edleben/ScoGes_App/pull/6) with passing required checks and explicitly accept closure                                            |

Evaluate the full [Sprint 0 Definition of Done](prompts/SPRINT_0_MASTER_PROMPT.md). Completion of the technical checklist does not imply an approved merge, deployment, or Sprint 1 activation. Do not infer final owner acceptance from the earlier readiness reply, which authorized verification after SMTP setup.

Legacy formatting debt, moderate development dependency advisories, the existing timestamp-helper search-path warning, onboarding field-reset UX, broader accessibility and pilot backup/restore/deployment checks retain their documented disposition. Recheck new findings; never weaken safeguards or erase known limits to close the gate.

## Transition procedure

1. Complete the reconciliation checks and validated PR review; record owner acceptance of Sprint 0 closure.
2. Only then mark Sprint 0 formally done in the sprint-status record, retaining this technical verification history.
3. Obtain separate explicit owner activation of the [bounded Sprint 1 proposal](prompts/SPRINT_1_MASTER_PROMPT.md), resolving its business decisions before their affected slices.
4. Keep later sprint features planned until implemented and verified; do not continue automatically.
