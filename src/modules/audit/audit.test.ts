import { describe, expect, it } from "vitest";
import { sanitizeAuditMetadata } from "@/modules/audit/audit";

describe("sanitizeAuditMetadata", () => {
  it("removes common secret-bearing keys", () => {
    expect(
      sanitizeAuditMetadata({
        token: "secret",
        password: "hidden",
        role: "tenant_admin",
      }),
    ).toEqual({ role: "tenant_admin" });
  });
});
