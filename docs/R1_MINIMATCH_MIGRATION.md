# R1 minimatch migration investigation — 2026-11-01

Decision: **no-go for a blanket override or a callable-only shim; conditional next step is a consumer-aware development-tool prototype**. No production migration is implemented or approved by this investigation. R1 remains partially remediated; the Sprint 0 gate remains open.

Baseline: `cd87cb310e6ee098229da30af4c83cd1732e6916`, policy branch `edwakson/ScoGes_App`, [PR #9](https://github.com/Edleben/ScoGes_App/pull/9) open at inspection. Vitest/mocker 5.0.3 remains the applied patch. Project package/lock/workspace/lint configuration and application files were not changed during the spike. Three pinned comparison packages were installed with scripts disabled in a newly created temporary directory outside the repository.

## Verified dependency scope

`pnpm list minimatch --depth Infinity --json` identified seven direct consumers. Repeated transitive paths are not separate remediation targets.

| Direct consumer                        | Installed version | Installed minimatch | Compatibility concern                                               |
| -------------------------------------- | ----------------- | ------------------- | ------------------------------------------------------------------- |
| `eslint`                               | 9.39.1            | 3.1.5               | File enumeration/ignore behavior; constructor use                   |
| `@eslint/config-array`                 | 0.21.2            | 3.1.5               | File/ignore matching, caches and both module formats                |
| `@eslint/eslintrc`                     | 3.3.7             | 3.1.5               | Default import and constructor use; legacy configuration paths      |
| `eslint-plugin-react`                  | 7.37.5            | 3.1.5               | Calls the module directly as a function in multiple rules           |
| `eslint-plugin-jsx-a11y`               | 6.10.2            | 3.1.5               | Babel default-import callable use in label/child-component helpers  |
| `eslint-plugin-import`                 | 2.32.0            | 3.1.5               | Default-import callable use and `makeRe()` in `no-internal-modules` |
| `@typescript-eslint/typescript-estree` | 8.70.0            | 10.2.6              | Named matching API in project-service default-project selection     |

Fresh registry metadata did not establish a supported upgrade-only route: ESLint 10.14.0 declares minimatch `^10.2.6`, config-array 0.23.5 declares `^10.2.4`, eslintrc 3.3.7 declares `^3.1.5`, and typescript-estree 8.72.1 declares `^10.2.2`. Current React/import/accessibility plugin releases still declare major 3. Next's current lint config 16.4.3 still includes those plugin families. These are dated observations, not promises about future releases.

Upgrading ESLint alone therefore does not remove the finding. Its [v10 migration](https://eslint.org/docs/latest/use/migrate-to-10.0.0) also introduces independent Node/plugin/configuration changes. The installed Next.js guide confirms ESLint 9/10 support but warns about plugin peer ranges. An ESLint-major or whole-linter replacement is not justified merely to clear this advisory.

## Actual isolated results

Compared minimatch **3.1.5**, **10.2.6** and **11.0.1**. The [advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249) lists the patch starting at 11.0.1. Version 11's [pinned documentation](https://github.com/isaacs/minimatch/blob/v11.0.1/README.md) describes a changed matcher implementation and no planned backport of that implementation to older versions.

- **API:** major 3 returns a callable module; 10/11 return a namespace. Version 11 removes the top-level and instance `makeRe()` APIs and changes compiled set entries from regular expressions to matcher objects. An export wrapper alone cannot recreate the removed API safely.
- **Glob corpus:** 40 synthetic cases covered extension braces, dotfiles, globstar, negation, extglobs, case handling, bracketed route names and Windows-style paths. Two major-3 versus 10/11 differences were observed on this Windows host: escaped bracketed paths and POSIX character classes. No 10-versus-11 Boolean mismatch was found in this small corpus; that is not proof of full compatibility.
- **Default repository lint:** baseline, raw-11 substitution and callable-adapter substitution each processed the same **102 files**, with **0 errors/warnings** and the same **86 enabled TSX rules**. File, diagnostic and rule hashes matched; `.next`, dependencies, coverage and Playwright output remained ignored.
- **Focused React witness:** `react/jsx-pascal-case` with an ignore glob and `<Bad_name />` returned the expected rule error on baseline; raw-11 substitution threw `minimatch is not a function`. The callable adapter restored this witness.
- **Focused import witness:** `import/no-internal-modules` with an allow glob and a resolvable internal import returned the expected rule error on baseline. Raw-11 substitution failed during rule loading; the callable adapter still threw because `makeRe` is absent.

Thus, even a passing full default lint command can miss broken rule options. Neither simulated candidate is acceptable for rollout. Sanitized [machine-readable observations and exact corpus](investigations/R1_MINIMATCH_RESULTS.json) retain the evidence without source contents, credentials or personal paths.

## Recommended bounded prototype

Prefer supported upstream consumer releases when available. Until then, a candidate must be an explicitly maintained consumer migration, not an unqualified override:

1. Use a disposable checkout with no `.env.local` or real credentials. Preserve the existing ESLint/Next rule configuration, package manager and application code. Recheck advisories/metadata first; choose the minimum patched matcher release deliberately.
2. Map every callable/default import and removed API in the seven consumers. Prototype consumer-scoped package-manager overrides plus version-pinned `pnpm patch` changes where necessary. React, import and accessibility consumers need attention; inspect both CommonJS/ESM helper builds before finalizing the patch list. Do not invent a transparent `makeRe()` replacement or retain a vulnerable engine underneath it.
3. For the import rule, evaluate replacing regex generation/testing with the supported matcher API. Prove allow/forbid, negation, normalization and resolved/unresolved import semantics. This is a proposal, not an implemented or verified fix.
4. Preserve all existing rules and ignore/file coverage. Do not drop Next, React, hooks, TypeScript, import or accessibility rules, or remove dependencies solely to hide the audit path. Patch scope is limited to lint consumers and their tests/lockfile; stop and replan if framework/application changes or a linter replacement become necessary.
5. Keep patch sources, exact upstream versions, maintenance owner, removal criteria and upstream issue/release references reviewable. A local patch set creates ongoing maintenance cost; nobody is assigned that responsibility yet. Publish no upstream comments/issues or registry packages without authorization.

This prototype is the recommended next engineering slice, **not an already safe migration or an authorization to merge/deploy it**. A supported upgrade route is preferred; the controlled patch route remains conditional on the evidence below and owner acceptance of maintenance scope.

## Go/no-go criteria for an implementation PR

- Fresh frozen installs resolve no minimatch version affected by the advisory (currently <11.0.1); verify the complete graph and audit, including development tooling. No advisory suppression, fabricated version or new waiver.
- Baseline/candidate file inclusion, ignore results and enabled rule configurations agree, or every deliberate difference has explicit review. Test bracketed Next routes, dotfiles, braces, globstar, negation and Windows path normalization.
- Exercise callable/default imports, the internal-module allow/forbid rule, React pattern options, custom accessibility controls/children, legacy configuration loading and TypeScript project-service selection. Verify CommonJS and ESM, not just the currently exercised flat configuration.
- Run compatibility fixtures on Windows and Linux with supported Node 22/24 versions; document any narrower supported environment. The current spike ran only on Windows/Node 24.
- Keep vulnerability regression probes bounded by child-process time/memory limits. The spike did not execute a denial-of-service exploit or certify security of a custom backport.
- Pass lint, generated types/typecheck, all unit/contract/CI-safety tests, production build, fresh migration/RLS/audit/concurrency and full Chromium CI on the exact implementation head, with zero skipped/flaky browser cases.
- Reject the candidate if any previously working rule crashes, a required rule is disabled, file coverage narrows silently, or vulnerable resolutions remain. Renew Sprint 0 acceptance only after the remaining risk is actually remediated or separately accepted; no such acceptance exists now.

## Evidence limits and reproduction

The temporary probe substituted CommonJS `require('minimatch')` in child-process memory for repository dependency modules. Raw mode returned the v11 namespace; callable mode returned a function delegating to its named matcher with namespace properties copied. Twenty requesting module files were intercepted. This did **not** change the installed graph and did **not** test ESM loader behavior, an actual pnpm override, a candidate frozen install or audit-zero outcome.

To repeat, create a new temporary package outside the repository; install aliases `legacy@npm:minimatch@3.1.5`, `modern@npm:minimatch@10.2.6` and `patched@npm:minimatch@11.0.1` with scripts disabled. Normalize the callable entry as `typeof module === 'function' ? module : module.minimatch` and run the recorded corpus. In separate child processes, compare the unchanged repository ESLint API run with the two in-memory substitutions. Use `lintText` with explicit standalone fixture rules so disabled rule options are exercised. Never deploy the investigation loader hook as an application or CI workaround.

Only investigation documentation is added to the repository. No candidate implementation, hosted test, production change or risk closure is claimed.
