import { afterEach, expect, it, vi } from "vitest";
import nextConfig from "../../../next.config";

afterEach(() => vi.unstubAllEnvs());

async function headers() {
  const rules = await nextConfig.headers?.();
  return rules?.[0]?.headers ?? [];
}

it("hardens all response paths without enabling subdomain HSTS or preload", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example");
  const configured = await headers();
  expect(configured).toContainEqual({
    key: "X-Content-Type-Options",
    value: "nosniff",
  });
  expect(configured).toContainEqual({ key: "X-Frame-Options", value: "DENY" });
  expect(configured).toContainEqual({
    key: "Referrer-Policy",
    value: "no-referrer",
  });
  expect(configured).toContainEqual({
    key: "Strict-Transport-Security",
    value: "max-age=31536000",
  });
  expect((await nextConfig.headers?.())?.[0]?.source).toBe("/:path*");
});

it("does not pin local HTTP or development origins to HTTPS", async () => {
  for (const [mode, origin] of [
    ["production", "http://127.0.0.1:3109"],
    ["development", "https://app.example"],
  ] as const) {
    vi.stubEnv("NODE_ENV", mode);
    vi.stubEnv("NEXT_PUBLIC_APP_URL", origin);
    expect(
      (await headers()).some(
        (header) => header.key === "Strict-Transport-Security",
      ),
    ).toBe(false);
  }
});
