"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveMembership, requireCurrentUser } from "@/lib/auth/session";
import { hasPermission, canAssignRole } from "@/modules/identity/permissions";
import { getLocale } from "@/i18n/messages";
import { adminText, type AdminState } from "./messages";
import { rolesSchema, statusSchema, settingsSchema } from "./schemas";
import type { Permission } from "@/types/foundation";

async function context(form: FormData, permission: Permission) {
  const user = await requireCurrentUser();
  const membership = await getActiveMembership(user.id);
  if (
    !membership ||
    membership.status !== "active" ||
    membership.userId !== user.id ||
    membership.tenantId !== form.get("contextTenantId") ||
    !hasPermission(membership.roles, permission)
  )
    return null;
  return membership;
}
function reply(
  form: FormData,
  ok: boolean,
  key: Parameters<typeof adminText>[1],
): AdminState {
  return {
    ok,
    message: adminText(getLocale(String(form.get("locale") ?? "fr")), key),
  };
}
async function execute(
  form: FormData,
  rpc: string,
  args: Record<string, unknown>,
): Promise<AdminState> {
  try {
    const client = await createSupabaseServerClient();
    if (!client) return reply(form, false, "unavailable");
    const { data, error } = await client.rpc(rpc, args);
    if (error)
      return reply(
        form,
        false,
        error.message === "last_admin"
          ? "lastAdmin"
          : error.message === "stale_write"
            ? "stale"
            : "failed",
      );
    if (typeof data !== "boolean") return reply(form, false, "failed");
    revalidatePath("/dashboard", "layout");
    return reply(form, true, data ? "saved" : "unchanged");
  } catch {
    return reply(form, false, "failed");
  }
}
export async function changeMemberRolesAction(
  _: AdminState,
  form: FormData,
): Promise<AdminState> {
  const membership = await context(form, "users.manage_roles");
  if (!membership) return reply(form, false, "denied");
  const parsed = rolesSchema.safeParse({
    ...Object.fromEntries(form),
    roles: form.getAll("roles"),
  });
  if (!parsed.success) return reply(form, false, "invalid");
  if (!parsed.data.roles.every((role) => canAssignRole(membership.roles, role)))
    return reply(form, false, "denied");
  return execute(form, "administer_tenant_membership", {
    target_tenant_id: membership.tenantId,
    target_membership_id: parsed.data.membershipId,
    expected_updated_at: parsed.data.updatedAt,
    new_role_keys: parsed.data.roles,
  });
}
export async function changeMemberStatusAction(
  _: AdminState,
  form: FormData,
): Promise<AdminState> {
  const membership = await context(form, "users.deactivate");
  if (!membership) return reply(form, false, "denied");
  const parsed = statusSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return reply(form, false, "invalid");
  return execute(form, "administer_tenant_membership", {
    target_tenant_id: membership.tenantId,
    target_membership_id: parsed.data.membershipId,
    expected_updated_at: parsed.data.updatedAt,
    new_status: parsed.data.status,
  });
}
export async function updateSettingsAction(
  _: AdminState,
  form: FormData,
): Promise<AdminState> {
  const membership = await context(form, "tenant.settings.write");
  if (!membership) return reply(form, false, "denied");
  const parsed = settingsSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return reply(form, false, "invalid");
  return execute(form, "update_tenant_settings", {
    target_tenant_id: membership.tenantId,
    expected_updated_at: parsed.data.updatedAt,
    new_country: parsed.data.country,
    new_base_currency: parsed.data.baseCurrency,
    new_timezone: parsed.data.timezone,
    new_default_locale: parsed.data.defaultLocale,
  });
}
