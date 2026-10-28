import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const { exchange } = vi.hoisted(() => ({ exchange: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession: exchange },
  })),
}));
vi.mock("@/lib/supabase/config", () => ({
  getAppUrl: () => "https://app.example",
}));
import { GET } from "./route";
describe("PKCE callback", () => {
  beforeEach(() => vi.clearAllMocks());
  it("rejects missing and expired codes with a safe notice", async () => {
    let response = await GET(
      new NextRequest("https://hostile.example/auth/callback"),
    );
    expect(response.headers.get("location")).toBe(
      "https://app.example/login?notice=invalidLink&locale=fr",
    );
    expect(exchange).not.toHaveBeenCalled();
    exchange.mockResolvedValue({ error: { message: "private auth error" } });
    response = await GET(
      new NextRequest("https://hostile.example/auth/callback?code=expired"),
    );
    expect(response.headers.get("location")).not.toContain("private");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("exchanges the PKCE code and ignores arbitrary destination URLs", async () => {
    exchange.mockResolvedValue({ error: null });
    const response = await GET(
      new NextRequest(
        "https://hostile.example/auth/callback?code=valid&next=https://evil.example&locale=en&sb_flow_id=flow",
      ),
    );
    expect(exchange).toHaveBeenCalledWith("valid", { flowId: "flow" });
    expect(response.headers.get("location")).toBe(
      "https://app.example/dashboard?locale=en",
    );
  });
  it("routes recovery only to the allowed reset page", async () => {
    exchange.mockResolvedValue({ error: null });
    const response = await GET(
      new NextRequest(
        "https://app.example/auth/callback?code=valid&next=/auth/reset-password",
      ),
    );
    expect(response.headers.get("location")).toBe(
      "https://app.example/auth/reset-password?locale=fr",
    );
  });
});
