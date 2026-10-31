# Hosted email lifecycle verification — 2026-10-31

Result: **confirmation, recovery and invitation journeys passed in French and English** after the owner configured hosted Supabase Auth SMTP. This closes the email technical milestone. Final Sprint 0 closure remains subject to the validated PR review and owner acceptance; Sprint 1 is inactive.

## Environment and method

- Application implementation: `20cce2793cf298d5e7384f541097340db73d34af`, on `edwakson/ScoGes_App`, reviewed through [PR #6](https://github.com/Edleben/ScoGes_App/pull/6).
- Hosted project: `jlaufrjmjjheisdqkkao`, selected exclusively from ignored `.env.local`; browser origin matched the configured application/callback origin.
- Real application signup/recovery/invitation forms and received mail links were used. Confirmation and recovery links were opened in the initiating browser context, exercising the actual PKCE exchange and cookies.
- Unique tagged addresses in the explicitly authorized Google Workspace test mailbox isolated each run from existing users. Random passwords remained in memory. Invitation-only setup used confirmed synthetic accounts; public signup and recovery were tested separately through their real forms.
- SMTP and mailbox connections verified TLS. IMAP used EXAMINE and BODY.PEEK with exact test-recipient searches; messages were not marked read, deleted or altered. Existing SMTP credentials were read locally and never printed. The Gmail connector repeatedly requested authentication, so the working credential-backed IMAP connection was used instead.
- No email body, verification URL, token, password, browser capture or raw provider/development log is stored in this repository.

## Executed assertions

| Journey                         | French      | English     | Evidence checked                                                                                                                                                           |
| ------------------------------- | ----------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Signup confirmation             | Passed      | Passed      | Public signup accepted; real confirmation received; expected project/origin/callback path; link completed to authenticated onboarding; authoritative Auth record confirmed |
| Onboarding                      | Passed      | Passed      | New synthetic institution created through the application; exact slug and authenticated creator checked                                                                    |
| Password recovery               | Passed      | Passed      | Real recovery requested and received; callback opened password-update page; password update completed and signed out; old password rejected and new password accepted      |
| Application invitation delivery | Passed      | Passed      | Tenant administrator submitted the actual invitation form; SMTP acceptance feedback and recipient mailbox receipt both checked                                             |
| Invitation acceptance           | Passed      | Passed      | Received fragment link captured; intended recipient authenticated and accepted; authoritative active membership with cashier role in the expected tenant verified          |
| Invitation replay               | Rejected    | Rejected    | Reusing the accepted link returned the safe rejection state                                                                                                                |
| Browser hydration               | No warnings | No warnings | Clean browser contexts, with no authenticated captures or raw console payloads retained                                                                                    |
| Synthetic fixture cleanup       | Passed      | Passed      | Exact run-owned accounts and tenants removed; tenant discovery restricted by unique slug and synthetic creator IDs                                                         |

## Diagnostic attempts and limits

The initial English run passed confirmation and recovery but timed out on an exact invitation role-label locator. A second isolated attempt identified that locator; no invitation had been sent in either attempt. After correcting the validation harness to match the existing select label, the isolated English invitation journey passed. The complete French sequence then passed. Every attempt cleaned up its exact synthetic fixtures.

This verifies real delivery to the authorized mailbox, not deliverability to every email provider, throughput/load capacity, future quota availability, template branding or production readiness. Actual confirmation/recovery expiry was not waited out; existing callback/browser/SQL negative tests remain separate evidence. Invitation replay was exercised with the real received link. The owner configured hosted SMTP; the agent did not change hosted Auth settings, schemas, credentials or delivery quotas.

## Completion record

The UI and Markdown tracker now record all six technical milestones at 100%, while Sprint 0 remains `in_progress` for final closure review. The [completion gate](SPRINT_0_COMPLETION_GATE.md) and [shared handoff](AI_HANDOFF.md) preserve this distinction. [Required PR checks](https://github.com/Edleben/ScoGes_App/pull/6/checks) must pass on the updated tracking commit before merge. No Sprint 1 implementation is authorized by this verification.

Read-only post-run checks confirmed the same four recorded hosted migration versions (20260917000100, 20261028013153, 20261028022102, 20261030185852) and zero remaining recent email-test accounts/tenants matching the controlled run prefixes. Fresh SQL invitation, tenant-authorization and transactional administration/audit assertions passed and rolled back their test transaction.

Reconciliation verification: lint, route type generation, typecheck, changed-file formatting and production build passed; all 96 unit/component/contract tests, 4 CI safety tests and 18 hosted-backed production Chromium cases passed (zero failures, skips or flaky results). The tracker review-state rendering and six-of-six milestone assertions passed. 72 relative document links resolved. Required isolated CI is refreshed on the review head.
