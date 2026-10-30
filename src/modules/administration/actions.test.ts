import { describe, it, expect, beforeEach, vi } from "vitest";
const { rpc, membership } = vi.hoisted(() => ({
  rpc: vi.fn(),
  membership: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ rpc }),
}));
vi.mock("@/lib/auth/session", () => ({
  requireCurrentUser: async () => ({ id: "actor" }),
  getActiveMembership: membership,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import {
  changeMemberRolesAction,
  changeMemberStatusAction,
  updateSettingsAction,
} from "./actions";
import { settingsSchema, rolesSchema } from "./schemas";
const tenant = "00000000-0000-4000-8000-000000000001",
  subject = "00000000-0000-4000-8000-000000000002";
function form(extra: Record<string, string | string[] | undefined> = {}) {
  const f = new FormData();
  for (const [k, v] of Object.entries({
    contextTenantId: tenant,
    membershipId: subject,
    updatedAt: "2026-10-30T00:00:00.000001+00:00",
    confirm: "on",
    roles: ["cashier"],
    ...extra,
  }))
    for (const value of Array.isArray(v) ? v : [v])
      if (value !== undefined) f.append(k, value);
  return f;
}
describe("tenant administration", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    membership.mockResolvedValue({
      userId: "actor",
      tenantId: tenant,
      status: "active",
      roles: ["tenant_admin"],
    });
    rpc.mockResolvedValue({ data: true, error: null });
  });
  it.each([
    changeMemberRolesAction,
    changeMemberStatusAction,
    updateSettingsAction,
  ])("denies permissions before any write", async (action) => {
    membership.mockResolvedValue({
      userId: "actor",
      tenantId: tenant,
      status: "active",
      roles: ["cashier"],
    });
    expect((await action({ ok: false }, form())).ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("rejects switched tenants, forged ownership and inactive context", async () => {
    for (const extra of [
      { tenantId: subject },
      { userId: "other" },
      { status: "inactive" },
    ]) {
      membership.mockResolvedValue({
        userId: "actor",
        tenantId: tenant,
        status: "active",
        roles: ["tenant_admin"],
        ...extra,
      });
      expect((await changeMemberRolesAction({ ok: false }, form())).ok).toBe(
        false,
      );
    }
    expect(rpc).not.toHaveBeenCalled();
  });
  it("validates role catalogs, revisions and explicit confirmation", async () => {
    for (const extra of [
      { roles: ["platform_admin"] },
      { roles: [] },
      { roles: ["cashier", "cashier"] },
      { updatedAt: "yesterday" },
      { confirm: "" },
    ])
      expect(
        (await changeMemberRolesAction({ ok: false }, form(extra))).ok,
      ).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("uses server tenant and never forwards actor or tenant claims", async () => {
    expect(
      (
        await changeMemberRolesAction(
          { ok: false },
          form({ tenant_id: subject, actor_user_id: "forged" }),
        )
      ).ok,
    ).toBe(true);
    expect(rpc).toHaveBeenCalledWith("administer_tenant_membership", {
      target_tenant_id: tenant,
      target_membership_id: subject,
      expected_updated_at: "2026-10-30T00:00:00.000001+00:00",
      new_role_keys: ["cashier"],
    });
  });
  it.each(["inactive", "revoked"])(
    "validates the %s transition request",
    async (status) => {
      expect(
        (await changeMemberStatusAction({ ok: false }, form({ status }))).ok,
      ).toBe(true);
      expect(rpc.mock.calls[0][1].new_status).toBe(status);
    },
  );
  it("rejects unsupported status transitions", async () => {
    expect(
      (
        await changeMemberStatusAction(
          { ok: false },
          form({ status: "active" }),
        )
      ).ok,
    ).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("updates settings with normalized values and the server tenant", async () => {
    expect(
      (
        await updateSettingsAction(
          { ok: false },
          form({
            country: "us",
            baseCurrency: "usd",
            timezone: "UTC",
            defaultLocale: "en",
          }),
        )
      ).ok,
    ).toBe(true);
    expect(rpc.mock.calls[0][1]).toMatchObject({
      target_tenant_id: tenant,
      new_country: "US",
      new_base_currency: "USD",
    });
  });
  it("returns safe last-admin, stale, database and transport errors", async () => {
    for (const message of [
      "last_admin",
      "stale_write",
      "secret database internals",
    ]) {
      rpc.mockResolvedValueOnce({ error: { message } });
      const r = await changeMemberRolesAction({ ok: false }, form());
      expect(r.ok).toBe(false);
      expect(r.message).not.toContain("secret");
    }
    rpc.mockRejectedValueOnce(new Error("private infrastructure"));
    expect((await changeMemberRolesAction({ ok: false }, form())).ok).toBe(
      false,
    );
  });
  it("never reports success for malformed RPC responses; handles no-op distinctly", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: null });
    expect((await changeMemberRolesAction({ ok: false }, form())).ok).toBe(
      false,
    );
    rpc.mockResolvedValueOnce({ data: false, error: null });
    expect((await changeMemberRolesAction({ ok: false }, form())).message).toBe(
      "Aucune modification nécessaire.",
    );
  });
  it("validates settings and supported roles", () => {
    const values = {
      contextTenantId: tenant,
      updatedAt: "2026-10-30T00:00:00Z",
      country: "TG",
      baseCurrency: "XOF",
      timezone: "Africa/Lome",
      defaultLocale: "fr",
    };
    expect(settingsSchema.safeParse(values).success).toBe(true);
    for (const invalid of [
      { country: "12" },
      { baseCurrency: "123" },
      { timezone: "Unknown/Timezone" },
      { defaultLocale: "de" },
    ])
      expect(settingsSchema.safeParse({ ...values, ...invalid }).success).toBe(
        false,
      );
    expect(
      rolesSchema.safeParse({
        ...values,
        membershipId: subject,
        roles: ["cashier", "auditor"],
        confirm: "on",
      }).success,
    ).toBe(true);
  });
});
