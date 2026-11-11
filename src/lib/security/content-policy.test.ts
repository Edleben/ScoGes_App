import { describe, expect, it } from "vitest";
import { createContentPolicy } from "./content-policy";

describe("request content security policy", () => {
  it("uses fresh strong nonces and production script/style restrictions", () => {
    const first = createContentPolicy({ development: false, https: true });
    const second = createContentPolicy({ development: false, https: true });
    expect(first.nonce).toMatch(/^[A-Za-z0-9+/]{24}$/);
    expect(first.nonce === second.nonce).toBe(false);
    expect(first.policy).toContain(`'nonce-${first.nonce}'`);
    expect(first.policy).toContain("'strict-dynamic'");
    expect(first.policy).not.toMatch(/unsafe-inline|unsafe-eval/);
    expect(first.policy).toContain("script-src-attr 'none'");
    expect(first.policy).toContain("style-src-attr 'none'");
    expect(first.policy).toContain("frame-ancestors 'none'");
    expect(first.policy).toContain("form-action 'self'");
    expect(first.policy).toContain("upgrade-insecure-requests");
  });

  it("confines debugging exceptions to development and leaves local HTTP usable", () => {
    const development = createContentPolicy({
      development: true,
      https: false,
    });
    expect(development.policy).toContain("'unsafe-eval'");
    expect(development.policy).toContain("ws: wss:");
    expect(development.policy).not.toContain("upgrade-insecure-requests");
    const localProduction = createContentPolicy({
      development: false,
      https: false,
    });
    expect(localProduction.policy).not.toContain("upgrade-insecure-requests");
    expect(localProduction.policy).not.toMatch(/unsafe-eval|ws: wss:/);
  });

  it("allows only an explicit valid backend origin, never credentials or directives", () => {
    for (const backendUrl of [
      "javascript:alert(1)",
      "https://user:password@example.com",
      "http://external.example",
      "https://*.example.com",
      "https://example.com;object-src",
      "https://bad.example\n; script-src *",
    ]) {
      const { policy } = createContentPolicy({
        development: false,
        https: true,
        backendUrl,
      });
      expect(policy).toContain("connect-src 'self';");
      expect(policy).not.toContain("password");
      expect(policy).not.toContain("script-src *");
    }
    for (const backendUrl of [
      "https://project.supabase.co/path?unused=value",
      "http://127.0.0.1:54321",
    ]) {
      const { policy } = createContentPolicy({
        development: false,
        https: false,
        backendUrl,
      });
      expect(policy).toContain(
        `connect-src 'self' ${new URL(backendUrl).origin};`,
      );
      expect(policy).not.toContain("unused=value");
    }
  });
});
