import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export const emailSchema = z.object({
  email: z.string().trim().email().max(254),
});
export const passwordSchema = z
  .object({
    password: z.string().min(8).max(128),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
  });
export const signUpSchema = emailSchema
  .extend({
    password: z.string().min(8).max(128),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
  });
export const invitationTokenSchema = z.string().regex(/^[a-f0-9]{64}$/);

export const inviteMemberSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum([
    "tenant_admin",
    "finance_manager",
    "cashier",
    "registrar",
    "auditor",
  ]),
});

export const deactivateMembershipSchema = z.object({
  membershipId: z.string().uuid(),
});
