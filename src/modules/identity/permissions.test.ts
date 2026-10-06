import { describe, expect, it } from "vitest";
import { canAssignRole, hasPermission } from "@/modules/identity/permissions";

describe("role permissions", () => {
  it("allows tenant admins to invite and manage roles", () => {
    expect(hasPermission(["tenant_admin"], "users.invite")).toBe(true);
    expect(canAssignRole(["tenant_admin"], "finance_manager")).toBe(true);
  });

  it("does not allow cashiers to invite users", () => {
    expect(hasPermission(["cashier"], "users.invite")).toBe(false);
    expect(canAssignRole(["cashier"], "registrar")).toBe(false);
  });
});
