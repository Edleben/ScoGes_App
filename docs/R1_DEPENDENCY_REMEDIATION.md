# R1 dependency remediation — 2026-11-01

Status: **partially remediated; minimatch remains open**. R1 is not closed and no residual-risk waiver is accepted. Sprint 0 stays open; R2–R7 and Sprint 1 status are unchanged.

## Applied change

Raised the Vitest minimum from `^5.0.1` to `^5.0.3`; the lockfile resolves Vitest, `@vitest/mocker` and `@vitest/spy` to 5.0.3. Kept existing Vite/Undici/source-map security overrides. No application code, authorization rule, schema, hosted setting or audit threshold changed.

The lockfile delta is confined to the Vitest dependency/peer graph, including its required `why-is-node-running` update and removal of two unused dependencies. Its Node requirement is compatible with the project's Node 22 CI. The frozen-lockfile install passed.

## Audit evidence

| Finding                                                                               | Before                           | After targeted patch                        |
| ------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------- |
| [Mock registration code injection](https://github.com/advisories/GHSA-qxg6-89mg-rqv8) | `@vitest/mocker` 5.0.1, moderate | Absent from refreshed audit; resolved 5.0.3 |
| [Windows redirect traversal](https://github.com/advisories/GHSA-xp26-3454-mjgp)       | `@vitest/mocker` 5.0.1, moderate | Absent from refreshed audit; resolved 5.0.3 |
| [Minimatch pattern amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249)  | 3.1.5 / 10.2.6, moderate         | Still reported on both installed lines      |
| Totals                                                                                | 3 moderate; 0 high/critical      | **1 moderate; 0 high/critical**             |

Both audit snapshots describe the configured registry on 2026-11-01. All findings were development-tool paths. Runtime safety and absence of future advisories are not certified by this snapshot. Do not remove the remaining finding from CI reports or describe R1 as complete.

## Why minimatch is not overridden

The published advisory lists patched versions starting at **11.0.1**. Registry lookups returned 3.1.5 and 10.2.6 for the installed major lines; attempted 3.1.6 and 10.2.7 lookups found no release. Recheck upstream before future work.

Installed ESLint 9.39.1 and React/import/accessibility lint plugins depend on the major-3 API. Readback confirmed `require('minimatch')` returns a function; React lint rules such as `jsx-pascal-case` and `no-unstable-nested-components` call it directly. The [current upstream API](https://github.com/isaacs/minimatch#usage) uses a named `minimatch` export. A blanket major-11 override can therefore break consumers even if some configured rules do not exercise those calls during one lint run. Major 11 also changes matching implementation/semantics, requiring more than a package-number substitution.

The refreshed ESLint latest-version metadata still declared a major-10 minimatch dependency; upgrading ESLint alone does not establish full remediation. No major override, vendored compatibility shim, audit suppression, disabled lint rule or manufactured patched version was introduced.

## Remaining work to complete R1

1. Look for supported consumer releases adopting a patched minimatch line or a maintained compatible backport. Verify package metadata/advisories again rather than treating this snapshot as permanent.
2. If unavailable, prepare a bounded lint-toolchain migration proposal identifying every consumer, Node/Next compatibility and rule coverage. A local backport requires actual upstream patch analysis, explicit maintenance ownership and vulnerability regression tests; changing an audited version label is not remediation.
3. For a migration, compare file inclusion/ignores, dotfiles, globstar/brace/negation behavior and Windows path handling. Exercise formerly callable APIs through affected lint rules, including rules not enabled by the default configuration. Preserve security and accessibility rules.
4. Rerun frozen install, full lint/types/unit/contract/CI-safety/build, audit and Chromium checks on the review head. Require no affected vulnerable resolutions, or an individually approved owner disposition; none is currently approved.

## Verification and review

Local lint/types/test/build checks and full isolated CI must validate this patch before review acceptance. Actual results, commit SHA and run links are recorded in the implementation log and remediation PR after execution; this document does not predeclare pending checks successful. The [remediation backlog](SPRINT_0_REMEDIATION.md) and [completion gate](SPRINT_0_COMPLETION_GATE.md) remain authoritative for the open status.

## Bounded migration investigation — 2026-11-01

[The completed investigation](R1_MINIMATCH_MIGRATION.md) identifies seven direct consumers and experimentally rejects a blanket v11 override and a callable-only adapter. Both passed default lint over the same 102 files/86 TSX rules, but focused React/import witnesses exposed crashes; v11 also removes `makeRe()`. A consumer-aware prototype is the conditional recommendation, with explicit maintenance and cross-platform/module-format criteria. No project dependency, lint configuration or application change was made by this spike. R1 remains partial and the remaining finding is not waived.

## Real consumer-patch prototype — 2026-11-01

[The actual installed prototype](R1_CONSUMER_PROTOTYPE.md) resolved only minimatch 11.0.1 and passed a frozen install with zero audit findings, using five version-pinned consumer patches. Ordinary lint/file/rule coverage and module/project-service checks agreed, but 2 of 15 optional rule-pattern cases differed on Windows. Promotion stopped under the agreed criteria. The main graph remains unchanged with one moderate finding; R1 is still partial. Linux/Node 22 and full candidate rollout checks were not run after that rejection. Further work requires supported upstream releases or an explicitly reviewed matching-contract modernization and patch maintenance scope.
