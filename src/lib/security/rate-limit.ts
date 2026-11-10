import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export type LimitDecision = "allowed" | "limited" | "unavailable";
export interface RateLimitAdapter {
  check(identifier: string): Promise<LimitDecision>;
}

export const limits = {
  login: [60, "10 m"],
  signup: [10, "1 h"],
  recovery: [20, "15 m"],
  callback: [60, "10 m"],
  capture: [60, "10 m"],
  password: [10, "15 m"],
  invitation: [20, "1 h"],
  acceptance: [20, "10 m"],
  onboarding: [5, "1 h"],
  administration: [60, "10 m"],
} as const;
export type LimitScope = keyof typeof limits;

// Normalize textual IPv6 forms so spelling cannot create new buckets.
export function ingressIdentity(
  headers: Pick<Headers, "get">,
  env: Record<string, string | undefined> = process.env,
): string | null {
  if (env.VERCEL === "1" && env.RATE_LIMIT_INGRESS === "vercel") {
    const ip = headers.get("x-vercel-forwarded-for")?.trim();
    if (!ip || ip.includes("%") || !isIP(ip)) return null;
    if (isIP(ip) === 4) return ip;
    const normalized = new URL(`http://[${ip}]/`).hostname;
    // IPv4-mapped IPv6 must share the IPv4 bucket.
    const mapped = normalized.match(/^\[::ffff:([a-f0-9]+):([a-f0-9]+)\]$/);
    if (mapped) {
      const value = parseInt(mapped[1], 16) * 65536 + parseInt(mapped[2], 16);
      return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join(".");
    }
    return normalized;
  }
  // A local server cannot prove the caller's IP through arbitrary headers.
  // All callers share one bucket; this is never an unlimited fallback.
  try {
    const app = new URL(env.NEXT_PUBLIC_APP_URL ?? "");
    if (
      env.VERCEL !== "1" &&
      app.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(app.hostname)
    )
      return "local-shared";
  } catch {
    /* Unconfigured ingress fails closed. */
  }
  return null;
}

export function privateIdentifier(
  secret: string,
  scope: string,
  value: string,
) {
  return createHmac("sha256", secret)
    .update(JSON.stringify(["scoges-rate-limit-v1", scope, value]))
    .digest("hex");
}

export function upstashAdapter(
  limiter: Pick<Ratelimit, "limit">,
): RateLimitAdapter {
  return {
    async check(identifier) {
      try {
        const result = await limiter.limit(identifier);
        // Consume pending rejection without logging provider payloads or keys.
        void result.pending.catch(() => undefined);
        // The SDK intentionally returns success on timeout; override it here.
        if (result.reason === "timeout") return "unavailable";
        return result.success ? "allowed" : "limited";
      } catch {
        return "unavailable";
      }
    },
  };
}

const adapters = new Map<LimitScope, RateLimitAdapter>();
export async function checkRateLimit(
  scope: LimitScope,
  identity: string | null,
): Promise<LimitDecision> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || !identity) return "unavailable";
  try {
    const endpoint = new URL(url);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(
      endpoint.hostname,
    );
    if (
      endpoint.username ||
      endpoint.password ||
      (endpoint.protocol !== "https:" &&
        !(local && endpoint.protocol === "http:" && process.env.VERCEL !== "1"))
    )
      return "unavailable";
    let adapter = adapters.get(scope);
    if (!adapter) {
      const [count, duration] = limits[scope];
      adapter = upstashAdapter(
        new Ratelimit({
          redis: new Redis({
            url,
            token,
            retry: false,
            signal: () => AbortSignal.timeout(2500),
          }),
          limiter: Ratelimit.slidingWindow(count, duration),
          prefix: `scoges:rl:v1:${scope}`,
          timeout: 2000,
          analytics: false,
          ephemeralCache: false,
        }),
      );
      adapters.set(scope, adapter);
    }
    // Domain-separated HMAC uses an existing server secret. Rotation resets
    // counters; neither raw IPs, user IDs, emails nor tokens are stored.
    const result = await adapter.check(
      privateIdentifier(token, scope, identity),
    );
    if (result === "unavailable")
      console.warn(
        JSON.stringify({ event: "security.rate_limit.unavailable", scope }),
      );
    return result;
  } catch {
    return "unavailable";
  }
}
