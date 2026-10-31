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

This verifies real delivery to the authorized mailbox, not deliverability to every email provider, throughput/load capacity, future quota availability, template branding or production readiness. Expiry is now also exercised deterministically by aging exact synthetic issuance/expiry records, without changing clocks or global lifetimes; see the supplemental matrix below. Invitation replay was exercised with the real received link. The owner configured hosted SMTP; the agent did not change hosted Auth settings, schemas, credentials or delivery quotas.

## Completion record

The UI and Markdown tracker now record all six technical milestones at 100%, while Sprint 0 remains `in_progress` for final closure review. The [completion gate](SPRINT_0_COMPLETION_GATE.md) and [shared handoff](AI_HANDOFF.md) preserve this distinction. [Required PR checks](https://github.com/Edleben/ScoGes_App/pull/6/checks) must pass on the updated tracking commit before merge. No Sprint 1 implementation is authorized by this verification.

Read-only post-run checks confirmed the same four recorded hosted migration versions (20260917000100, 20261028013153, 20261028022102, 20261030185852) and zero remaining recent email-test accounts/tenants matching the controlled run prefixes. Fresh SQL invitation, tenant-authorization and transactional administration/audit assertions passed and rolled back their test transaction.

Reconciliation verification: lint, route type generation, typecheck, changed-file formatting and production build passed; all 96 unit/component/contract tests, 4 CI safety tests and 18 hosted-backed production Chromium cases passed (zero failures, skips or flaky results). The tracker review-state rendering and six-of-six milestone assertions passed. 72 relative document links resolved. Required isolated CI is refreshed on the review head.

## Supplemental expired/reused-link and delivery-failure validation — 2026-10-31

The application baseline is merged PR #6, main commit `4fc102a51ebcecf700f588642ee59da1d60195bf`. This follow-up leaves production application behavior, schemas, providers and dependencies unchanged.

| Negative case             | Hosted controlled validation (English)                                                                                                                  | Automated isolated FR/EN coverage                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Reused confirmation link  | Rejected after real receipt/completion; no access granted                                                                                               | Passed in isolated CI                                                                                                            |
| Reused recovery link      | Rejected after real receipt/password update; no reset access                                                                                            | Passed in isolated CI                                                                                                            |
| Expired confirmation link | Received link rejected; account remains unconfirmed                                                                                                     | Passed in isolated CI                                                                                                            |
| Expired recovery link     | Received link rejected; old password remains valid                                                                                                      | Passed in isolated CI                                                                                                            |
| Expired invitation        | Received application link rejected; no membership created                                                                                               | Passed in isolated CI                                                                                                            |
| SMTP transport failure    | Isolated local application process received a controlled SMTP 421 refusal; safe failure feedback, failed delivery status and one failure audit verified | Passed: TLS mail catcher rejects a disallowed synthetic recipient; failure state/audit and absence of a received message checked |

Hosted expiry changes were restricted to four purpose-created account identities and the exact run-owned invitation. Only their issuance/expiry timestamps were aged. No token, existing-account password, global expiry, clock, hosted SMTP setting or migration was changed. Successful confirmation/recovery and actual mailbox receipt preceded the negative checks. Cleanup removed all four synthetic accounts and the one synthetic tenant.

The SMTP failure process overrode only its own SMTP environment, used synthetic credentials and a loopback refusal server with no relay, and was stopped afterward. The configured hosted Auth mailer and the user's development server were untouched. This tests immediate transport rejection; asynchronous post-acceptance bounces and broad recipient-provider deliverability are not claimed.

Repeatable CI tests read actual Auth and application emails from their separate local mail catchers, navigate the received links, verify identity/membership/password outcomes, and clean exact fixtures. Two shallow unconfirmed-signup cases are replaced by 14 full mail lifecycle cases (seven per language): the isolated suite registers 32 browser tests. Expiry/cleanup CLI operations require both CI/local flags, loopback database/Auth/application/mailbox/SMTP endpoints and synthetic identities. Guard tests reject hosted/deceptive URLs. No mail body, token-bearing URL or authenticated capture enters artifacts.

Local checks passed: 98 unit/component/contract tests, 6 CI safety tests, lint, generated route types, typecheck, formatting, production build and all 18 hosted-backed browser cases. Docker is unavailable locally; all 32 isolated browser cases passed in [PR CI](https://github.com/Edleben/ScoGes_App/actions/runs/41243007217) and [push CI](https://github.com/Edleben/ScoGes_App/actions/runs/41242974762) for test implementation commit `73b6a116d91f7322e887975af90b01dd62412650`, with zero failures, skips or flaky results. Existing SQL expiry/replay/tenant/audit tests remain separate complementary coverage.

Supplemental review: [PR #7](https://github.com/Edleben/ScoGes_App/pull/7) and its [current required checks](https://github.com/Edleben/ScoGes_App/pull/7/checks). Hosted negative cases used English; the repeatable isolated matrix passed in French and English. The earlier hosted positive journeys remain verified in both languages.
