import { test, expect } from "./fixtures";

test("production pages use fresh nonces, hardened headers and executable framework scripts", async ({
  page,
  request,
}) => {
  const spoofed = await request.get("/?locale=en", {
    headers: {
      "x-nonce": "attacker-selected",
      "Content-Security-Policy": "script-src *",
    },
  });
  const first = spoofed.headers()["content-security-policy"];
  expect(first).not.toContain("attacker-selected");
  expect(first).not.toContain("script-src *");
  const response = await page.goto("/?locale=fr");
  expect(response?.status()).toBe(200);
  const headers = response!.headers();
  const policy = headers["content-security-policy"];
  expect(policy).toContain("'strict-dynamic'");
  if (process.env.E2E_SERVER_MODE === "production")
    expect(policy).not.toMatch(/unsafe-inline|unsafe-eval/);
  expect(policy).toContain("style-src-attr 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("no-referrer");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["cache-control"]).toContain("no-store");
  const firstNonce = first.match(/'nonce-([^']+)'/)?.[1];
  const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
  expect(Boolean(nonce) && nonce !== firstNonce).toBe(true);
  const mismatchCount = await page
    .locator("script[src], script:not([type])")
    .evaluateAll(
      (scripts, expected) =>
        scripts.filter(
          (script) => (script as HTMLScriptElement).nonce !== expected,
        ).length,
      nonce,
    );
  expect(mismatchCount).toBe(0);
  await page.goto("/login?locale=fr");
  await page.getByRole("link", { name: "English", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  const css = await page
    .locator('link[rel="stylesheet"]')
    .first()
    .getAttribute("href");
  expect(Boolean(css)).toBe(true);
  const asset = await request.get(css!);
  expect(asset.status()).toBe(200);
  expect(asset.headers()["x-content-type-options"]).toBe("nosniff");
  expect(asset.headers()["cross-origin-resource-policy"]).toBe("same-origin");
});

test("auth callback failures retain policy and privacy headers", async ({
  request,
}) => {
  const response = await request.get("/auth/callback?locale=en", {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(307);
  expect(response.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(response.headers()["referrer-policy"]).toBe("no-referrer");
  expect(response.headers()["cache-control"]).toContain("no-store");
});
