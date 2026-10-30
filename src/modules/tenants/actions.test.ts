import { beforeEach, describe, expect, it, vi } from "vitest";
const { rpc, client } = vi.hoisted(() => ({ rpc: vi.fn(), client: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: client,
}));
vi.mock("@/lib/auth/session", () => ({
  requireCurrentUser: async () => ({ id: "authenticated-actor" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw Error(`REDIRECT:${url}`);
  },
}));
import { createTenantAction } from "./actions";
function form(extra: Record<string, string> = {}) {
  const f = new FormData();
  for (const [k, v] of Object.entries({
    name: "Validation institution",
    slug: "Validation Institution",
    country: "tg",
    baseCurrency: "xof",
    timezone: "Africa/Lome",
    defaultLocale: "fr",
    ...extra,
  }))
    f.set(k, v);
  return f;
}
describe("tenant onboarding failure safety", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    client.mockResolvedValue({ rpc });
    rpc.mockResolvedValue({
      data: "00000000-0000-4000-8000-000000000001",
      error: null,
    });
  });
  it("validates form input before contacting the database", async () => {
    expect(
      (await createTenantAction({ ok: false }, form({ name: "X" }))).ok,
    ).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("preserves the authenticated actor, normalization and successful redirect", async () => {
    await expect(
      createTenantAction(
        { ok: false },
        form({ actor_user_id: "forged", tenant_id: "forged" }),
      ),
    ).rejects.toThrow("REDIRECT:/dashboard");
    expect(rpc).toHaveBeenCalledWith(
      "create_tenant_with_admin",
      expect.objectContaining({
        actor_user_id: "authenticated-actor",
        tenant_slug: "validation-institution",
        tenant_country: "TG",
        tenant_base_currency: "XOF",
      }),
    );
  });
  it.each(["fr", "en"])(
    "returns safe duplicate-slug feedback in %s",
    async (locale) => {
      rpc.mockResolvedValue({
        error: { code: "23505", message: "private relation and query details" },
      });
      const result = await createTenantAction({ ok: false }, form({ locale }));
      expect(result.ok).toBe(false);
      expect(result.message).not.toContain("private");
      expect(result.message).toContain(
        locale === "fr" ? "déjà utilisé" : "already used",
      );
    },
  );
  it("never exposes raw database errors", async () => {
    rpc.mockResolvedValue({
      error: { message: "secret infrastructure details" },
    });
    const result = await createTenantAction({ ok: false }, form());
    expect(result.ok).toBe(false);
    expect(result.message).not.toContain("secret");
  });
  it("handles unavailable configuration and rejected transport safely", async () => {
    client.mockResolvedValueOnce(null);
    expect((await createTenantAction({ ok: false }, form())).ok).toBe(false);
    rpc.mockRejectedValueOnce(Error("private connection details"));
    const result = await createTenantAction(
      { ok: false },
      form({ locale: "en" }),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain("temporarily unavailable");
    expect(result.message).not.toContain("private");
  });
  it("does not report success for a malformed RPC result", async () => {
    rpc.mockResolvedValue({ data: { untrusted: "result" }, error: null });
    expect((await createTenantAction({ ok: false }, form())).ok).toBe(false);
  });
});
