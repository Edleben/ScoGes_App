import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export const inviteMemberSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["tenant_admin", "finance_manager", "cashier", "registrar", "auditor"]),
});

export const deactivateMembershipSchema = z.object({
  membershipId: z.string().uuid(),
});
