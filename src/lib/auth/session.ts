import { getRequestLocale } from "@/i18n/server";
import { localizedPath } from "@/i18n/navigation";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { activeTenantCookie } from "@/modules/identity/auth-navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthUser, Membership, TenantRole } from "@/types/foundation";

type MembershipRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  status: Membership["status"];
  membership_roles: { roles: { key: TenantRole } | null }[];
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    isPlatformAdmin: user.app_metadata?.platform_role === "platform_admin",
  };
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(localizedPath("/login", await getRequestLocale()));
  }

  return user;
}

export async function getActiveMembership(
  userId: string,
): Promise<Membership | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const preferred = (await cookies()).get(activeTenantCookie)?.value;
  const queryMembership = (tenantId?: string) => {
    let query = supabase
      .from("memberships")
      .select("id,tenant_id,user_id,status,membership_roles(roles(key))")
      .eq("user_id", userId)
      .eq("status", "active");
    if (tenantId) query = query.eq("tenant_id", tenantId);
    return query
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle<MembershipRow>();
  };
  const preferredResult =
    preferred &&
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      preferred,
    )
      ? await queryMembership(preferred)
      : null;
  // The cookie is only a preference. Ownership and active status remain authoritative.
  const { data, error } =
    preferredResult?.data || preferredResult?.error
      ? preferredResult
      : await queryMembership();

  if (error) {
    // Do not mistake an unavailable database or missing schema for a new user.
    throw new Error("Tenant context is temporarily unavailable.");
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    userId: data.user_id,
    status: data.status,
    roles: data.membership_roles
      .map((item) => item.roles?.key)
      .filter((role): role is TenantRole => Boolean(role)),
  };
}
