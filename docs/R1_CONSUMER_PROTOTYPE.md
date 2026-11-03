# R1 consumer-aware prototype — 2026-11-01

Outcome: **no-go for promotion under the agreed strict-parity criteria**. The real installed candidate clears the advisory, but two optional rule-pattern cases change behavior. The main application dependency graph is unchanged and still has one moderate minimatch finding. R1 remains partial; Sprint 0 remains open.

## Scope and isolation

The owner authorized the bounded prototype after reviewing [the investigation](R1_MINIMATCH_MIGRATION.md). Baseline: `e17b0f315092997b6d309c832ba347520e707b77`, [PR #9](https://github.com/Edleben/ScoGes_App/pull/9). A new local clone contained tracked files only, no `.env.local`, and a disabled push URL. Install lifecycle scripts were disabled. No application, authentication, tenant, database, hosted setting or main-repository lint/dependency change was made.

Unlike the prior loader simulation, this prototype used an **actual installed dependency graph**:

- Seven exact-parent overrides resolve minimatch to **11.0.1**.
- Five version-pinned `pnpm patch` packages: React, import, accessibility, config-array and eslintrc.
- Sixteen vendor files changed, with **20 added and 20 removed lines**. Imports use the supported named API; helper ESM imports use a namespace. The import rule replaces `makeRe()`/regex testing with `Minimatch`/`match()` at its own call site.
- No recreated regex generator, fallback vulnerable matcher, removed rule, fabricated package version or audit suppression.

The passive [result/patch bundle](investigations/R1_CONSUMER_PROTOTYPE_RESULTS.json) contains exact version-scoped diffs, hashes, workspace proposal, fixture inputs and observations. **It is rejected research data, not an active patch registration.** Do not copy its workspace settings into the main project without a newly reviewed implementation.

## Executed checks

| Check                              | Observed result                                                                                                            |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Candidate frozen install           | Passed; scripts disabled                                                                                                   |
| Candidate complete minimatch graph | Only 11.0.1 resolved                                                                                                       |
| Candidate dependency audit         | Zero findings at every severity                                                                                            |
| Ordinary lint                      | Baseline and candidate: same 102 files, same 86 enabled TSX rules, zero errors/warnings; file/rule/diagnostic hashes agree |
| Ignore checks                      | Same results for `.next`, dependencies, coverage, Playwright output and an application file                                |
| Focused rule cases                 | **13/15 agree; 2 differ**; repaired callable/removed-API witnesses no longer crash                                         |
| CommonJS/ESM helper loading        | Config-array and eslintrc matching agree for included/excluded files after correcting one test-harness import              |
| TypeScript project service         | Allowed default-project selection succeeds; denied selection is rejected in both graphs                                    |
| Forty-case glob corpus             | 38 agree; the same two legacy-versus-modern differences remain                                                             |
| Main project graph/config          | Unchanged; audit still one moderate minimatch finding                                                                      |

## Promotion blockers

These are **focused optional configurations**, not failures in the currently configured ordinary lint run. They nevertheless fail the promised broader compatibility check and must not be silently accepted.

| Witness                                                                 | Baseline                   | Patched candidate | Consequence                                                                               |
| ----------------------------------------------------------------------- | -------------------------- | ----------------- | ----------------------------------------------------------------------------------------- |
| `react/jsx-pascal-case`, ignore `[[:alpha:]]*`, `<Bad_name />`          | Reports the naming error   | No error          | A modern POSIX-class interpretation suppresses a diagnostic that legacy behavior produced |
| `import/no-internal-modules`, Windows-backslash allow pattern for `lib` | Allows the internal import | Reports an error  | The upgraded matcher interprets the legacy Windows pattern differently                    |

The matching corpus also changes escaped bracketed-route matching and POSIX character classes on Windows. This is evidence of changed semantics, not proof of a runtime exploit or evidence that the current application is broken.

The initial eslintrc ESM harness incorrectly requested a default export. Both graphs failed that test equally. A corrected **named `OverrideTester` export** follow-up passed against both graphs; that harness mistake is disclosed in the machine-readable evidence and is not counted as a candidate defect.

## Stop decision and unexecuted gates

The approved [go/no-go criteria](R1_MINIMATCH_MIGRATION.md#go-no-go-criteria-for-an-implementation-pr) require reviewed matching behavior and no silently weakened rule options. The local compatibility gate failed. Therefore:

- No candidate settings, patches or lockfile were promoted into the application.
- No attempt was made to grow a compatibility engine to mimic legacy regex/glob parsing.
- Linux/Node 22, denial-of-service workload probes and candidate full application/build/database/browser gates were **not run** after the Windows parity rejection. They cannot be claimed as passing or replaced by the ordinary project's green CI.
- Results are limited to Windows, Node 24 and local pnpm 11.25. The normal project's CI uses its own pinned tooling; candidate portability is unverified.

## Recommended next decision

Do not merge this as a transparent minimatch security override. There are two credible follow-up routes:

1. **Supported consumer upgrades:** recheck for maintained releases using the patched engine. Those releases were not available in the inspected graph; waiting does not resolve R1 or accept its risk.
2. **Explicit lint-toolchain modernization:** if the owner chooses to continue, approve the changed matching contract and ongoing ownership of five vendor patch packages. Inventory actual rule options, define portable patterns, review the two semantic changes and then run Windows/Linux, Node 22/24 and CommonJS/ESM parity plus the full required regression pipeline on the actual candidate. Preserve rule/file coverage and remove vulnerable resolutions. This is a larger scope than the attempted transparent migration, not a pre-approved implementation.

A custom legacy backport/security matcher would carry additional maintenance and security-review burden and is not recommended within this bounded task. No residual-risk waiver or Sprint 0 acceptance is inferred. R2–R7 remain unchanged; no later sprint is activated.

## Reproduction and retention

The result bundle records all 15 focused fixture inputs, the earlier exact 40-case corpus reference, both graph outcomes, the corrected ESM follow-up and the five generated pnpm patches. The candidate lockfile is retained in the disposable local clone; its SHA-256 is recorded, not a portable frozen-lock snapshot. Recreating it elsewhere requires refreshing dependency metadata, regenerating/installing a reviewed candidate lock and rerunning the checks. No secret-bearing file, raw browser capture or hosted data is included.
