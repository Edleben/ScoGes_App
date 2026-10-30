// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
const { client, membership, query, from } = vi.hoisted(() => ({
  client: vi.fn(),
  membership: vi.fn(),
  from: vi.fn(),
  query: {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    returns: vi.fn(),
    maybeSingle: vi.fn(),
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: client,
}));
vi.mock("@/lib/auth/session", () => ({
  requireCurrentUser: async () => ({ id: "actor" }),
  getActiveMembership: membership,
}));
vi.mock("@/components/shared/forms", () => ({ InviteMemberForm: () => null }));
vi.mock("@/modules/administration/forms", () => ({
  SettingsForm: () => null,
  MemberRolesForm: () => null,
  MemberStatusForm: () => null,
}));
import UsersPage from "@/app/dashboard/users/page";
import SettingsPage from "@/app/dashboard/settings/page";
describe("administration failure states", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    membership.mockResolvedValue({
      tenantId: "tenant",
      userId: "actor",
      status: "active",
      roles: ["tenant_admin"],
    });
    for (const name of ["select", "eq", "order", "range"] as const)
      query[name].mockReturnValue(query);
    from.mockReturnValue(query);
    client.mockResolvedValue({ from });
    query.returns.mockResolvedValue({
      data: null,
      error: { message: "private database details" },
    });
    query.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "private database details" },
    });
  });
  afterEach(cleanup);
  for (const locale of ["fr", "en"] as const) {
    for (const [name, Page] of [
      ["members", UsersPage],
      ["settings", SettingsPage],
    ] as const) {
      it(`${name} reports a safe ${locale} dependency error instead of an empty success`, async () => {
        const view = render(
          await Page({ searchParams: Promise.resolve({ locale }) }),
        );
        expect(view.getByRole("alert")).toHaveTextContent(
          locale === "fr"
            ? "temporairement indisponibles"
            : "temporarily unavailable",
        );
        expect(view.container).not.toHaveTextContent(
          "private database details",
        );
        expect(view.queryByRole("table")).toBeNull();
      });
      it(`${name} handles missing configuration in ${locale}`, async () => {
        client.mockResolvedValue(null);
        const view = render(
          await Page({ searchParams: Promise.resolve({ locale }) }),
        );
        expect(view.getByRole("alert")).toBeVisible();
      });
    }
    it(`denies directory reads without permissions in ${locale}`, async () => {
      membership.mockResolvedValue({ tenantId: "tenant", roles: ["cashier"] });
      const view = render(
        await UsersPage({ searchParams: Promise.resolve({ locale }) }),
      );
      expect(view.getByRole("alert")).toHaveTextContent("permission");
      expect(from).not.toHaveBeenCalled();
    });
  }
});
