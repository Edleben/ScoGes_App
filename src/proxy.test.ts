import { expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@/lib/supabase/config", () => ({
  getSupabaseBrowserConfig: () => null,
}));
import { proxy } from "./proxy";

it("overwrites spoofed locale headers using only the validated query locale", async () => {
  for (const [query, expected] of [
    ["en", "en"],
    ["unsupported", "fr"],
    ["", "fr"],
  ]) {
    const response = await proxy(
      new NextRequest(`https://app.example/dashboard?locale=${query}`, {
        headers: { "x-edxstore-locale": "spoofed" },
      }),
    );
    expect(response.headers.get("x-middleware-request-x-edxstore-locale")).toBe(
      expected,
    );
  }
});

it("overwrites client policy/nonce and secures public and missing-config responses", async () => {
  for (const path of ["/", "/login", "/missing-page"]) {
    const request = new NextRequest(`https://app.example${path}`, {
      headers: {
        "x-nonce": "attacker-selected",
        "Content-Security-Policy": "script-src *",
      },
    });
    const response = await proxy(request);
    const policy = response.headers.get("Content-Security-Policy");
    expect(policy).toContain("'strict-dynamic'");
    expect(policy).not.toContain("attacker-selected");
    expect(policy).not.toContain("script-src *");
    expect(
      response.headers.get("x-middleware-request-content-security-policy"),
    ).toBe(policy);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
  }
});
