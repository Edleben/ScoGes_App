import { beforeEach, describe, expect, it, vi } from "vitest";

const { client, query, cookieGet } = vi.hoisted(() => {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  };
  return { query, client: { from: vi.fn(() => query) }, cookieGet: vi.fn() };
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => client),
}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: cookieGet })),
}));

import { getActiveMembership } from "./session";

describe("active tenant resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGet.mockReturnValue(undefined);
  });

  it("resolves the cashier's own active membership without users.read", async () => {
    query.maybeSingle.mockResolvedValue({
      data: {
        id: "membership-a",
        tenant_id: "tenant-a",
        user_id: "user-a",
        status: "active",
        membership_roles: [{ roles: { key: "cashier" } }],
      },
      error: null,
    });
    expect(await getActiveMembership("user-a")).toEqual({
      id: "membership-a",
      tenantId: "tenant-a",
      userId: "user-a",
      status: "active",
      roles: ["cashier"],
    });
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-a");
    expect(query.eq).toHaveBeenCalledWith("status", "active");
    expect(query.order).toHaveBeenCalledWith("created_at", { ascending: true });
    expect(query.order).toHaveBeenCalledWith("id", { ascending: true });
  });

  it("returns null only when the query succeeds without a membership", async () => {
    query.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await getActiveMembership("user-a")).toBeNull();
  });

  it("scopes a preferred tenant to the current user and falls back if the cookie is forged", async () => {
    cookieGet.mockReturnValue({
      value: "00000000-0000-4000-8000-000000000001",
    });
    query.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "own",
          tenant_id: "tenant-a",
          user_id: "user-a",
          status: "active",
          membership_roles: [],
        },
        error: null,
      });
    expect((await getActiveMembership("user-a"))?.tenantId).toBe("tenant-a");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-a");
    expect(query.eq).toHaveBeenCalledWith(
      "tenant_id",
      "00000000-0000-4000-8000-000000000001",
    );
  });

  it("does not redirect a database failure into tenant onboarding or expose database details", async () => {
    query.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "private database details" },
    });
    await expect(getActiveMembership("user-a")).rejects.toThrow(
      "Tenant context is temporarily unavailable.",
    );
  });
});
