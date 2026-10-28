import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const serverUrl = new URL(baseUrl);
if (
  !["127.0.0.1", "localhost"].includes(serverUrl.hostname) ||
  serverUrl.protocol !== "http:"
) {
  throw new Error("E2E server must use a local HTTP URL.");
}

function spawnCommand(command, args) {
  return spawn(command, args, {
    stdio: "inherit",
    shell: false,
    windowsHide: true,
  });
}

async function waitForServer(url) {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        return;
      }
    } catch {
      // The dev server is still starting.
    }

    await wait(1_000);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function isServerReady(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function stopProcessTree(child) {
  if (!child.pid || child.exitCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    const killer = spawn(
      "cmd.exe",
      ["/c", "taskkill", "/pid", String(child.pid), "/T", "/F"],
      {
        stdio: "ignore",
        detached: true,
        shell: false,
        windowsHide: true,
      },
    );
    killer.unref();
    await wait(1_000);
    child.kill();
    child.unref();
    return;
  }

  child.kill("SIGTERM");
  child.unref();
}

async function runSmokeTest() {
  const child = spawnCommand(process.execPath, [
    require.resolve("@playwright/test/cli"),
    "test",
  ]);
  await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error("Playwright E2E suite failed.")),
    );
  });
}

async function main() {
  const serverAlreadyRunning = await isServerReady(baseUrl);
  const server = serverAlreadyRunning
    ? null
    : spawnCommand(process.execPath, [
        require.resolve("next/dist/bin/next"),
        process.env.E2E_SERVER_MODE === "production" ? "start" : "dev",
        "--hostname",
        serverUrl.hostname,
        "--port",
        serverUrl.port || "3000",
      ]);
  let exitCode = 0;

  try {
    if (!serverAlreadyRunning) {
      await waitForServer(baseUrl);
    }
    await runSmokeTest();
  } catch (error) {
    exitCode = 1;
    console.error(
      error instanceof Error ? error.message : "E2E verification failed.",
    );
  } finally {
    if (server) {
      await stopProcessTree(server);
    }
    process.exitCode = exitCode;
  }
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
