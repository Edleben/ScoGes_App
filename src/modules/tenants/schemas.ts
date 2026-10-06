import { z } from "zod";
import { normalizeSlug } from "@/lib/utils";

export const localeSchema = z.enum(["fr", "en"]);

export const tenantOnboardingSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(72)
    .transform(normalizeSlug)
    .pipe(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
  country: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  baseCurrency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  timezone: z.string().trim().min(3).max(80),
  defaultLocale: localeSchema,
});

export const tenantSettingsSchema = tenantOnboardingSchema.pick({
  country: true,
  baseCurrency: true,
  timezone: true,
  defaultLocale: true,
});

export type TenantOnboardingInput = z.input<typeof tenantOnboardingSchema>;
export type TenantOnboardingData = z.output<typeof tenantOnboardingSchema>;
