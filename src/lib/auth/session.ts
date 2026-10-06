import { redirect } from "next/navigation";
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
    redirect("/login");
  }

  return user;
}

export async function getActiveMembership(userId: string): Promise<Membership | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("memberships")
    .select("id,tenant_id,user_id,status,membership_roles(roles(key))")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle<MembershipRow>();

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
