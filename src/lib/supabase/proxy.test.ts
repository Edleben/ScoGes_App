import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const { getUser, createClient } = vi.hoisted(() => ({
  getUser: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock("@supabase/ssr", () => ({ createServerClient: createClient }));
vi.mock("@/lib/supabase/config", () => ({
  getSupabaseBrowserConfig: () => ({
    url: "https://project.example",
    key: "public-test-key",
  }),
}));
import { proxy } from "@/proxy";
describe("session refresh proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("propagates refreshed cookies to both the request and response with no caching", async () => {
    createClient.mockImplementation((_url, _key, options) => {
      getUser.mockImplementation(async () => {
        options.cookies.setAll(
          [
            {
              name: "session",
              value: "refreshed",
              options: { path: "/", sameSite: "lax" },
            },
          ],
          { Pragma: "no-cache" },
        );
        return { data: { user: { id: "a" } }, error: null };
      });
      return { auth: { getUser } };
    });
    const request = new NextRequest("https://app.example/dashboard");
    const response = await proxy(request);
    expect(getUser).toHaveBeenCalledOnce();
    expect(request.cookies.get("session")?.value).toBe("refreshed");
    expect(response.cookies.get("session")?.value).toBe("refreshed");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Pragma")).toBe("no-cache");
  });
});
