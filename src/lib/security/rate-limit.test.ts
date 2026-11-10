import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ingressIdentity,
  privateIdentifier,
  upstashAdapter,
  checkRateLimit,
} from "./rate-limit";
import type { Ratelimit } from "@upstash/ratelimit";

afterEach(() => vi.unstubAllEnvs());
describe("verified ingress", () => {
  const env = { VERCEL: "1", RATE_LIMIT_INGRESS: "vercel" };
  it("ignores untrusted forwarding headers and requires server configuration", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4",
      "x-real-ip": "1.2.3.4",
      "x-vercel-forwarded-for": "1.2.3.4",
      "x-vercel-id": "spoofed",
    });
    expect(ingressIdentity(headers, {})).toBeNull();
    expect(ingressIdentity(headers, { VERCEL: "1" })).toBeNull();
    expect(
      ingressIdentity(headers, {
        NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000",
      }),
    ).toBe("local-shared");
    headers.set("x-vercel-forwarded-for", "5.6.7.8");
    expect(ingressIdentity(headers, env)).toBe("5.6.7.8");
    headers.delete("x-vercel-forwarded-for");
    expect(ingressIdentity(headers, env)).toBeNull();
  });
  it.each([
    "",
    "unknown",
    "1.2.3.4, 5.6.7.8",
    "127.0.0.1:8080",
    "999.1.2.3",
    "fe80::1%eth0",
  ])("rejects malformed IP %s", (ip) => {
    expect(
      ingressIdentity(new Headers({ "x-vercel-forwarded-for": ip }), env),
    ).toBeNull();
  });
  it("canonicalizes IPv6 and IPv4-mapped addresses", () => {
    const identity = (ip: string) =>
      ingressIdentity(new Headers({ "x-vercel-forwarded-for": ip }), env);
    expect(identity("2001:0db8:0:0:0:0:0:1")).toBe(identity("2001:db8::1"));
    expect(identity("::ffff:192.0.2.1")).toBe(identity("192.0.2.1"));
  });
});
it("uses domain-separated keyed identifiers without raw personal data", () => {
  const key = privateIdentifier("test-secret", "login", "192.0.2.1");
  expect(key).toMatch(/^[a-f0-9]{64}$/);
  expect(key).toBe(privateIdentifier("test-secret", "login", "192.0.2.1"));
  expect(key).not.toBe(privateIdentifier("test-secret", "signup", "192.0.2.1"));
  expect(key).not.toBe(
    privateIdentifier("another-secret", "login", "192.0.2.1"),
  );
});
it("fails closed for missing configuration and unverified ingress", async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  expect(await checkRateLimit("login", "local-shared")).toBe("unavailable");
  expect(await checkRateLimit("login", null)).toBe("unavailable");
});
it("denies SDK timeout success and provider errors without leaking payloads", async () => {
  const limit = vi.fn<Ratelimit["limit"]>();
  const adapter = upstashAdapter({ limit });
  limit.mockResolvedValue({
    success: true,
    reason: "timeout",
    pending: Promise.resolve(),
    limit: 1,
    remaining: 0,
    reset: 0,
  });
  expect(await adapter.check("opaque")).toBe("unavailable");
  limit.mockRejectedValue(new Error("private provider payload"));
  expect(await adapter.check("opaque")).toBe("unavailable");
  limit.mockResolvedValue({
    success: false,
    pending: Promise.resolve(),
    limit: 1,
    remaining: 0,
    reset: 0,
  });
  expect(await adapter.check("opaque")).toBe("limited");
  limit.mockResolvedValue({
    success: true,
    pending: Promise.resolve(),
    limit: 1,
    remaining: 0,
    reset: 0,
  });
  expect(await adapter.check("opaque")).toBe("allowed");
});
