# Project tracker

Verified checkpoint: **2026-10-31**. Active sprint: **Sprint 0**, in progress. Work branch: `edwakson/ScoGes_App`; main changes only through validated PRs.

This Markdown tracker and the UI consume the same milestone definitions in `src/modules/project-tracker/tracker-data.ts`. A unit test compares every row below with that data to prevent drift. Edit the data and this table together; rerun verification before changing completion status.

## Sprint status

| ID       | Status      | Progress | Scope                                       |
| -------- | ----------- | -------- | ------------------------------------------- |
| sprint-0 | in_progress | 83%      | Fondations plateforme                       |
| sprint-1 | planned     | 0%       | Academique, eleves, responsables et imports |
| sprint-2 | planned     | 0%       | Frais, facturation et echeanciers           |
| sprint-3 | planned     | 0%       | Paiements, rapprochement et recus           |
| sprint-4 | planned     | 0%       | Recouvrement et communications              |
| sprint-5 | planned     | 0%       | Reporting et administration avancee         |

## Milestones

| ID                         | Status  | Progress | Sprint   | Milestone                                   |
| -------------------------- | ------- | -------- | -------- | ------------------------------------------- |
| workspace-quality          | done    | 100%     | sprint-0 | Workspace et qualite                        |
| tenant-rbac                | done    | 100%     | sprint-0 | Tenant, membership et RBAC                  |
| onboarding-audit           | done    | 100%     | sprint-0 | Onboarding et audit                         |
| foundation-ui              | done    | 100%     | sprint-0 | Shell UI administration                     |
| bilingual-completion       | done    | 100%     | sprint-0 | Compléter la traduction de la fondation     |
| email-lifecycle-validation | planned | 0%       | sprint-0 | Valider les parcours e-mail de bout en bout |
| academic-references        | planned | 0%       | sprint-1 | References academiques                      |
| students-guardians         | planned | 0%       | sprint-1 | Eleves et responsables                      |
| enrollments                | planned | 0%       | sprint-1 | Inscriptions                                |
| imports                    | planned | 0%       | sprint-1 | Imports CSV/XLSX                            |
| fee-configuration          | planned | 0%       | sprint-2 | Configuration des frais                     |
| invoices                   | planned | 0%       | sprint-2 | Factures                                    |
| installments               | planned | 0%       | sprint-2 | Echeanciers                                 |
| payment-abstraction        | planned | 0%       | sprint-3 | Abstraction paiement                        |
| allocations-reconciliation | planned | 0%       | sprint-3 | Allocations et rapprochement                |
| receipts-webhooks          | planned | 0%       | sprint-3 | Recus et webhooks                           |
| collections                | planned | 0%       | sprint-4 | Workflow recouvrement                       |
| reminders                  | planned | 0%       | sprint-4 | Relances automatisees                       |
| reports                    | planned | 0%       | sprint-5 | Rapports                                    |
| exports                    | planned | 0%       | sprint-5 | Exports                                     |
| advanced-admin             | planned | 0%       | sprint-5 | Administration avancee                      |

## Evidence and interpretation

- [Merged PR #1: CI](https://github.com/Edleben/ScoGes_App/pull/1), [PR #2: administration](https://github.com/Edleben/ScoGes_App/pull/2), and [PR #3: Sprint 0 validation](https://github.com/Edleben/ScoGes_App/pull/3). PR #3 merged as `92efae9`.
- [Reviewed validation CI](https://github.com/Edleben/ScoGes_App/actions/runs/41133779878): 68 unit/component/contract tests, 4 CI safety tests, 15 browser tests; required gate passed. These counts describe that dated functional baseline; later documentation/invariant checks can increase the unit-test total.
- Hosted development verification: all 15 browser tests, SQL/RLS/audit assertions, Auth/schema connectivity and SMTP authentication passed. Synthetic fixtures were cleaned up. SMTP verification does not prove inbox receipt.
- Five milestones are delivered; email lifecycle acceptance remains planned. Sprint 0 progress is `round(500 / 6) = 83%`, an unweighted engineering checklist score. It is not SaaS-wide completion, code coverage, automatic CI telemetry, or production certification.

## Remaining Sprint 0 work

Bilingual foundation coverage is complete, including authenticated FR/EN onboarding validation, localized navigation and document language. Global error safety/retry is component-tested in both languages; no hosted outage was induced.

1. Validate confirmation/recovery email links and invitation delivery/receipt using a controlled mailbox or explicitly approved recipients.

The onboarding form currently resets edited fields after validation failure; preserve/re-enter the complete form in tests and record any future UX change explicitly. Full formatting debt (29 files at the checkpoint), two moderate development dependency advisories, the existing timestamp-helper search-path warning, and pilot operational hardening remain documented separately.

See [validation evidence](SPRINT_0_VALIDATION.md), [agent handoff](AI_HANDOFF.md), and [documentation map](README.md). Do not start Sprint 1 without the owner's explicit instruction.

## Sprint 1 planning

A [bounded Sprint 1 proposal](prompts/SPRINT_1_MASTER_PROMPT.md) is ready for review. The [foundation completion gate](SPRINT_0_COMPLETION_GATE.md) remains open. Preparing this prompt does not change any milestone status, activate Sprint 1 or authorize its implementation.
