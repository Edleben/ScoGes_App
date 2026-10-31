# Foundation completion gate

Assessment: **2026-10-31 — NOT PASSED.** Sprint 0 remains active at 83% of six unweighted milestones. Sprint 1 remains planned at 0%. This is a readiness record, not a new implementation authorization.

## Current evidence

The [Sprint 0 validation report](SPRINT_0_VALIDATION.md) and [tracker](PROJECT_TRACKER.md) now record five delivered milestones and one unresolved email acceptance milestone. Merged [PR #4](https://github.com/Edleben/ScoGes_App/pull/4), commit `2c751624dde35d38abf47aafaac7deed45c550c1`, synchronized trackers and the agent handoff. Its [review CI](https://github.com/Edleben/ScoGes_App/actions/runs/41137265658) passed 69 unit/component/contract tests, 4 CI safety tests and 15 Chromium tests. These dated passes do not prove the outstanding acceptance work complete.

## Required closure evidence

| Gate                         | Current assessment                                   | Evidence required to close                                                                                                                                                                                                                                                                                                                              |
| ---------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bilingual foundation         | Verified locally                                     | Complete FR/EN onboarding, shell, dashboard/tracker and global-error coverage; locale-preserving navigation and correct document language; authenticated tests of both languages and failure states.                                                                                                                                                    |
| Email lifecycle              | Open                                                 | Confirmation and recovery links exchanged through real supported flows; invitation initiated through the application and delivered to a controlled/authorized recipient; receipt verified. SMTP authentication, mocked transport and preconfirmed browser fixtures alone are insufficient. Keep tokens and mailbox contents out of committed artifacts. |
| Foundation regression        | Prior baseline passed; refresh after closure changes | Lint, route type generation, typecheck, unit/contract and CI safety tests, changed-file formatting, production build, database/RLS/audit/concurrency checks and complete authenticated Chromium suite on the reviewed closure commit; disclose skips/flaky outcomes.                                                                                    |
| Migration/security integrity | Prior baseline verified; recheck after changes       | Existing migration history consistent with the intended environment; negative tenant/permission checks and audit rollback still pass. Use isolated CI services for ordinary checks. Hosted migration application remains a separately authorized action. No new unresolved critical/high finding or weakened safeguard.                                 |
| Documentation and acceptance | Pending                                              | UI/Markdown trackers, validation evidence and shared handoff agree; remaining debt has explicit disposition; reviewed PR passes required validation. Record owner acceptance and explicit Sprint 1 prompt activation against the reviewed commit.                                                                                                       |

Evaluate the complete [Sprint 0 Definition of Done](prompts/SPRINT_0_MASTER_PROMPT.md), not only this table. Revalidate affected controls after any change; retain evidence links and actual results. Do not replace acceptance evidence with a percentage or a green build.

Legacy formatting debt, moderate development dependency advisories, the existing timestamp-helper search-path warning, onboarding field-reset UX and pilot operational checks remain tracked risks. Triage their severity explicitly; do not silently erase them or expand this gate into unrelated rewrites. A newly discovered security or integrity blocker takes precedence over sprint scheduling.

## Transition procedure

1. Close the remaining email lifecycle milestone within Sprint 0 and review its evidence.
2. Refresh the checks above and record the closure commit/PR, results, residual risks and owner acceptance here and in the shared handoff.
3. Obtain explicit owner activation of the [bounded Sprint 1 proposal](prompts/SPRINT_1_MASTER_PROMPT.md), resolving its business decision points before their affected slices.
4. Only then identify Sprint 1 as active in the documentation and trackers. Retain Sprint 0 history; do not automatically mark Sprint 1 features implemented.

## Bilingual closure evidence — 2026-10-31

The bilingual follow-up passed local lint/typecheck/build/format checks, 77 unit/component/contract tests, 4 CI safety tests, hosted transactional SQL authorization/audit assertions and all 18 Chromium tests (no skips/flaky results). See the [dated validation follow-up](SPRINT_0_VALIDATION.md#bilingual-foundation-follow-up--2026-10-31) for exact scope and component-only error coverage. This closes the bilingual milestone; email receipt and real confirmation/recovery link completion remain open. Required CI/review and owner acceptance still apply before merging; this evidence does not activate Sprint 1.
