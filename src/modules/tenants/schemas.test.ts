import { describe, expect, it } from "vitest";
import { tenantOnboardingSchema } from "@/modules/tenants/schemas";

describe("tenantOnboardingSchema", () => {
  it("normalizes slug and uppercase locale-sensitive tenant settings", () => {
    const result = tenantOnboardingSchema.parse({
      name: "College Lumiere",
      slug: "College Lumiere!",
      country: "tg",
      baseCurrency: "xof",
      timezone: "Africa/Lome",
      defaultLocale: "fr",
    });

    expect(result).toMatchObject({
      slug: "college-lumiere",
      country: "TG",
      baseCurrency: "XOF",
    });
  });

  it("rejects unsupported locales", () => {
    expect(() =>
      tenantOnboardingSchema.parse({
        name: "College Lumiere",
        slug: "college-lumiere",
        country: "TG",
        baseCurrency: "XOF",
        timezone: "Africa/Lome",
        defaultLocale: "es",
      }),
    ).toThrow();
  });
});
