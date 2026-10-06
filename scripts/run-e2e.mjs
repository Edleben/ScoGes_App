import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import { chromium } from "@playwright/test";

const baseUrl = "http://127.0.0.1:3000";

function spawnCommand(command, args) {
  return spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

async function waitForServer(url) {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
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
    const response = await fetch(url);
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
    const killer = spawn("cmd.exe", ["/c", "taskkill", "/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      detached: true,
      shell: false,
    });
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
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(baseUrl);
    await page.getByRole("heading", { name: /EDXSTORE School Management SaaS/i }).waitFor();
    await page.getByRole("link", { name: /Acceder a la plateforme/i }).click();
    await page.waitForURL(/\/login$/);
    await page.getByRole("heading", { name: /Connexion/i }).waitFor();
    console.log("E2E smoke passed: public landing page links to login.");
  } finally {
    await browser.close();
  }
}

async function main() {
  const serverAlreadyRunning = await isServerReady(baseUrl);
  const server = serverAlreadyRunning ? null : spawnCommand("next", ["dev", "--hostname", "127.0.0.1"]);
  let exitCode = 0;

  try {
    if (!serverAlreadyRunning) {
      await waitForServer(baseUrl);
    }
    await runSmokeTest();
  } catch (error) {
    exitCode = 1;
    throw error;
  } finally {
    if (server) {
      await stopProcessTree(server);
    }
    process.exit(exitCode);
  }
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
