import { beforeEach, describe, expect, it, vi } from "vitest";
import { authText } from "./auth-messages";
const { rpc, send, membership, provider, cookieStore } = vi.hoisted(() => ({
  rpc: vi.fn(),
  send: vi.fn(),
  membership: vi.fn(),
  provider: vi.fn(),
  cookieStore: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ rpc }),
}));
vi.mock("@/lib/supabase/config", () => ({
  getAppUrl: () => "https://app.example",
}));
vi.mock("@/lib/auth/session", () => ({
  requireCurrentUser: async () => ({ id: "actor" }),
  getActiveMembership: membership,
}));
vi.mock("@/lib/email/smtp", () => ({ createEmailProvider: provider }));
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
import {
  inviteMemberAction,
  acceptInvitationAction,
  captureInvitationAction,
} from "./invitation-actions";
const form = (values: Record<string, string>) => {
  const form = new FormData();
  Object.entries(values).forEach(([k, v]) => form.set(k, v));
  return form;
};
const token = "a".repeat(64),
  id = "00000000-0000-4000-8000-000000000001";
describe("invitation actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    membership.mockResolvedValue({ tenantId: id, roles: ["tenant_admin"] });
    provider.mockReturnValue({ sendInvitation: send });
    cookieStore.get.mockReturnValue({ value: token });
  });
  it("rejects missing permissions before issuing or sending an invitation", async () => {
    membership.mockResolvedValue({ tenantId: id, roles: ["cashier"] });
    const result = await inviteMemberAction(
      { ok: false },
      form({ email: "a@example.com", role: "tenant_admin" }),
    );
    expect(result.message).toBe(authText("fr", "denied"));
    expect(rpc).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });
  it("does not create an unusable invitation when SMTP is missing", async () => {
    provider.mockReturnValue(null);
    expect(
      (
        await inviteMemberAction(
          { ok: false },
          form({ email: "a@example.com", role: "cashier" }),
        )
      ).message,
    ).toBe(authText("fr", "smtpMissing"));
    expect(rpc).not.toHaveBeenCalled();
  });
  it("uses server-resolved tenant and role checks, sends a fragment link and records delivery", async () => {
    rpc
      .mockResolvedValueOnce({ data: { id, token }, error: null })
      .mockResolvedValueOnce({ error: null });
    send.mockResolvedValue(undefined);
    const result = await inviteMemberAction(
      { ok: false },
      form({
        email: "a@example.com",
        role: "cashier",
        tenant_id: "forged",
        locale: "en",
      }),
    );
    expect(rpc.mock.calls[0]).toEqual([
      "issue_tenant_invitation",
      {
        target_tenant_id: id,
        invitee_email: "a@example.com",
        role_key: "cashier",
      },
    ]);
    const url = new URL(send.mock.calls[0][0].url);
    expect(url.searchParams.has("token")).toBe(false);
    expect(url.hash).toBe(`#token=${token}`);
    expect(rpc.mock.calls[1][1].delivered).toBe(true);
    expect(result.message).toBe(authText("en", "delivered"));
  });
  it("reports SMTP failure instead of a false success", async () => {
    rpc
      .mockResolvedValueOnce({ data: { id, token }, error: null })
      .mockResolvedValueOnce({ error: null });
    send.mockRejectedValue(new Error("private smtp details"));
    const result = await inviteMemberAction(
      { ok: false },
      form({ email: "a@example.com", role: "cashier" }),
    );
    expect(result).toEqual({
      ok: false,
      message: authText("fr", "deliveryFailed"),
    });
    expect(rpc.mock.calls[1][1].delivered).toBe(false);
  });
  it("rejects malformed tokens before setting cookies or calling RPCs", async () => {
    expect(
      (await captureInvitationAction({ ok: false }, form({ token: "invalid" })))
        .ok,
    ).toBe(false);
    expect(cookieStore.set).not.toHaveBeenCalled();
  });
  it("accepts only the server-held token and selects only the tenant returned by the RPC", async () => {
    rpc.mockResolvedValue({ data: { tenant_id: id }, error: null });
    await expect(
      acceptInvitationAction(
        { ok: false },
        form({ tenant_id: "forged", role: "tenant_admin", token: "forged" }),
      ),
    ).rejects.toThrow("REDIRECT:/dashboard");
    expect(rpc).toHaveBeenCalledWith("accept_tenant_invitation", {
      invitation_token: token,
    });
    expect(cookieStore.set.mock.calls[0][1]).toBe(id);
    expect(cookieStore.delete).toHaveBeenCalled();
  });
});
