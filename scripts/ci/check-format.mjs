import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import * as prettier from "prettier";

const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8", windowsHide: true });
let base = process.env.FORMAT_BASE_SHA;
if (!base || /^0+$/.test(base))
  base = git("merge-base", "HEAD", "origin/main").trim();
if (!/^[a-f0-9]{40,64}$/i.test(base))
  throw new Error("Formatting base must be a Git commit SHA.");
if (process.env.CI && base === git("rev-parse", "HEAD").trim())
  base = git("rev-parse", "HEAD^").trim();
const changed = new Set(
  [
    ...git("diff", "--name-only", "--diff-filter=ACMR", "-z", base).split("\0"),
    ...git("ls-files", "--others", "--exclude-standard", "-z").split("\0"),
  ].filter(Boolean),
);
// The pnpm lockfile is generated; canonical source documents are not rewritten to pay down unrelated formatting debt.
let failures = 0;
for (const file of changed) {
  if (!existsSync(file) || file === "pnpm-lock.yaml") continue;
  const info = await prettier.getFileInfo(file, { ignorePath: ".gitignore" });
  if (info.ignored || !info.inferredParser) continue;
  if (
    !(await prettier.check(readFileSync(file, "utf8"), {
      ...(await prettier.resolveConfig(file)),
      filepath: file,
    }))
  ) {
    console.error(`Formatting required: ${JSON.stringify(file)}`);
    failures++;
  }
}
console.log(
  `Changed-file formatting: ${failures === 0 ? "passed" : "failed"}.`,
);
if (failures) process.exitCode = 1;
