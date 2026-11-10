import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { setTimeout as wait } from "node:timers/promises";
import { expect, it } from "vitest";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import {
  upstashAdapter,
  privateIdentifier,
} from "../../src/lib/security/rate-limit";

// Explicit opt-in; ordinary CI/unit tests never load hosted credentials.
const hosted = process.env.RATE_LIMIT_TEST_HOSTED === "1";
const env = {
  ...(hosted ? parseEnv(readFileSync(".env.local", "utf8")) : {}),
  ...process.env,
};
if (!hosted && env.CI_ENFORCE_INTEGRATION !== "1")
  throw Error(
    "Redis integration requires an explicit hosted or isolated CI opt-in.",
  );
const url = env.UPSTASH_REDIS_REST_URL;
const token = env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !token) throw Error("Redis integration configuration is missing.");
const endpoint = new URL(url);
if (!hosted && !["127.0.0.1", "localhost"].includes(endpoint.hostname))
  throw Error("Isolated Redis tests require loopback.");
const redis = new Redis({
  url,
  token,
  retry: false,
  signal: () => AbortSignal.timeout(2500),
});
it("enforces atomic counters across adapter instances, expires keys and recovers after expiry", async () => {
  const prefix = "scoges:test:rl:" + randomUUID();
  const identifier = privateIdentifier(token, "integration", randomUUID());
  const make = () =>
    new Ratelimit({
      redis,
      prefix,
      limiter: Ratelimit.slidingWindow(3, "1 s"),
      timeout: 2000,
      analytics: false,
      ephemeralCache: false,
    });
  let stage = "concurrency";
  try {
    // Align early in the one-second window to avoid a legitimate boundary crossing.
    await wait(1000 - (Date.now() % 1000) + 20);
    const outcomes = await Promise.all(
      Array.from({ length: 12 }, () =>
        upstashAdapter(make()).check(identifier),
      ),
    );
    expect(outcomes.filter((x) => x === "allowed").length).toBe(3);
    expect(outcomes.filter((x) => x === "limited").length).toBe(9);
    stage = "key privacy and TTL";
    const keys = await redis.keys(prefix + ":*");
    expect(keys.length).toBeGreaterThan(0);
    expect(
      keys.every((key) => !key.includes(token) && key.includes(identifier)),
    ).toBe(true);
    for (const key of keys) expect(await redis.pttl(key)).toBeGreaterThan(0);
    stage = "expiry";
    await wait(3300);
    expect(await redis.keys(prefix + ":*")).toEqual([]);
    expect(await upstashAdapter(make()).check(identifier)).toBe("allowed");
  } catch {
    throw Error(
      `Redis integration failed at ${stage}; provider details withheld.`,
    );
  } finally {
    try {
      const keys = await redis.keys(prefix + ":*");
      if (keys.length) await redis.del(...keys);
    } catch {
      throw Error(
        "Redis test fixture cleanup failed; only namespaced expiring synthetic keys were used.",
      );
    }
  }
});
it("fails closed for a real transport failure", async () => {
  const offline = new Redis({
    url: "http://127.0.0.1:1",
    token: "synthetic",
    retry: false,
    signal: () => AbortSignal.timeout(100),
  });
  const limiter = new Ratelimit({
    redis: offline,
    limiter: Ratelimit.slidingWindow(1, "1 s"),
    timeout: 50,
    analytics: false,
    ephemeralCache: false,
  });
  expect(await upstashAdapter(limiter).check("synthetic")).toBe("unavailable");
});

it("rejects an actual SDK timeout even when its response is marked successful", async () => {
  const server = createServer((_req, res) => {
    setTimeout(() => res.end(JSON.stringify({ result: [0, 1] })), 300).unref();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw Error("Timeout fixture failed.");
  try {
    const slow = new Redis({
      url: "http://127.0.0.1:" + address.port,
      token: "synthetic",
      retry: false,
      signal: () => AbortSignal.timeout(200),
    });
    const limiter = new Ratelimit({
      redis: slow,
      limiter: Ratelimit.slidingWindow(1, "1 s"),
      timeout: 30,
      analytics: false,
      ephemeralCache: false,
    });
    expect(await upstashAdapter(limiter).check("synthetic")).toBe(
      "unavailable",
    );
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
