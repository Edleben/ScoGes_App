import { mkdirSync, writeFileSync, appendFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

// Official release assets, pinned with SHA-256 from GitHub release metadata.
const tools = {
  actionlint: {
    repo: "rhysd/actionlint",
    tag: "v1.7.12",
    asset: "actionlint_1.7.12_linux_amd64.tar.gz",
    sha: "8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8",
  },
  gitleaks: {
    repo: "gitleaks/gitleaks",
    tag: "v8.30.1",
    asset: "gitleaks_8.30.1_linux_x64.tar.gz",
    sha: "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb",
  },
  mailpit: {
    repo: "axllent/mailpit",
    tag: "v1.32.0",
    asset: "mailpit-linux-amd64.tar.gz",
    sha: "4b5993c978e8604c70d43927e2ad103b311bba3b1822fa0cf1d4ee4ec890a93c",
  },
  supabase: {
    repo: "supabase/cli",
    tag: "v2.122.0",
    asset: "supabase_linux_amd64.tar.gz",
    sha: "59ed066847b98d7461c60e9109d40cab6b9756177ce06ebb05b51338519f5136",
  },
};
if (process.platform !== "linux" || process.arch !== "x64")
  throw new Error("CI binary installation requires Linux x64.");
const directory = join(process.env.RUNNER_TEMP || tmpdir(), "scoges-ci-tools");
mkdirSync(directory, { recursive: true });
for (const name of process.argv.slice(2)) {
  const tool = tools[name];
  if (!tool) throw new Error("Unknown CI tool.");
  const response = await fetch(
    `https://github.com/${tool.repo}/releases/download/${tool.tag}/${tool.asset}`,
    { signal: AbortSignal.timeout(60000) },
  );
  if (!response.ok) throw new Error(`Failed to download ${name}.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (createHash("sha256").update(bytes).digest("hex") !== tool.sha)
    throw new Error(`Checksum mismatch for ${name}.`);
  const archive = join(directory, tool.asset);
  writeFileSync(archive, bytes);
  execFileSync("tar", ["-xzf", archive, "-C", directory, name], {
    windowsHide: true,
  });
  chmodSync(join(directory, name), 0o755);
  console.log(`Verified ${name} ${tool.tag}.`);
}
if (process.env.GITHUB_PATH)
  appendFileSync(process.env.GITHUB_PATH, directory + "\n");
