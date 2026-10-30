import { z } from "zod";
import { inviteMemberSchema } from "@/modules/identity/schemas";
import { tenantSettingsSchema } from "@/modules/tenants/schemas";

const revision = z.object({
  contextTenantId: z.string().uuid(),
  updatedAt: z.iso.datetime({ offset: true }),
});
export const rolesSchema = revision.extend({
  membershipId: z.string().uuid(),
  roles: z
    .array(inviteMemberSchema.shape.role)
    .min(1)
    .max(5)
    .refine((roles) => new Set(roles).size === roles.length),
  confirm: z.literal("on"),
});
export const statusSchema = revision.extend({
  membershipId: z.string().uuid(),
  status: z.enum(["inactive", "revoked"]),
  confirm: z.literal("on"),
});
export const settingsSchema = revision
  .extend(tenantSettingsSchema.shape)
  .extend({
    country: z
      .string()
      .trim()
      .regex(/^[a-z]{2}$/i)
      .transform((s) => s.toUpperCase()),
    baseCurrency: z
      .string()
      .trim()
      .regex(/^[a-z]{3}$/i)
      .transform((s) => s.toUpperCase()),
    timezone: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: value });
          return true;
        } catch {
          return false;
        }
      }),
  });
