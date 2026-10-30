import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { browserSummary } from "./environment.mjs";

const summary = browserSummary(
  JSON.parse(readFileSync("test-results/e2e-raw.json", "utf8")),
);
writeFileSync(
  "test-results/e2e-summary.json",
  JSON.stringify(summary, null, 2) + "\n",
);
if (process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## Browser validation\n\n| Passed | Failed | Flaky | Skipped |\n| --- | --- | --- | --- |\n| ${summary.passed} | ${summary.failed} | ${summary.flaky} | ${summary.skipped} |\n\nNo skipped or flaky tests are accepted in CI.\n`,
  );
console.log(summary);
if (!summary.success) process.exitCode = 1;
