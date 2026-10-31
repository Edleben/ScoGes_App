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
