import { describe, expect, it } from "vitest";
import {
  AuthorizationError,
  requireMembership,
  requirePermission,
} from "@/modules/identity/authorization";
import type { AuthUser, Membership } from "@/types/foundation";

const user: AuthUser = { id: "user-a", email: "a@example.com" };
const membership: Membership = {
  id: "membership-a",
  tenantId: "tenant-a",
  userId: "user-a",
  status: "active",
  roles: ["tenant_admin"],
};

describe("authorization helpers", () => {
  it("accepts active same-tenant membership", () => {
    expect(requireMembership(user, membership, "tenant-a")).toEqual(membership);
  });

  it("rejects cross-tenant membership access", () => {
    expect(() => requireMembership(user, membership, "tenant-b")).toThrow(AuthorizationError);
  });

  it("requires explicit permissions", () => {
    expect(() => requirePermission(user, membership, "tenant-a", "users.invite")).not.toThrow();
    expect(() =>
      requirePermission(
        user,
        { ...membership, roles: ["cashier"] },
        "tenant-a",
        "users.invite",
      ),
    ).toThrow(AuthorizationError);
  });
});
