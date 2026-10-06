"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppUrl } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveMembership, requireCurrentUser } from "@/lib/auth/session";
import { inviteMemberSchema, signInSchema } from "@/modules/identity/schemas";

export type AuthActionState = {
  ok: boolean;
  message?: string;
};

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Invalid sign-in details." };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, message: error.message };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const email = String(formData.get("email") ?? "");

  if (supabase && email) {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getAppUrl()}/login`,
    });
  }

  redirect("/login");
}

export async function inviteMemberAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const user = await requireCurrentUser();
  const membership = await getActiveMembership(user.id);
  const supabase = await createSupabaseServerClient();

  if (!supabase || !membership) {
    return { ok: false, message: "Tenant context is unavailable." };
  }

  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Invalid invitation." };
  }

  const { error } = await supabase.rpc("invite_tenant_member", {
    target_tenant_id: membership.tenantId,
    invitee_email: parsed.data.email,
    role_key: parsed.data.role,
    actor_user_id: user.id,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/dashboard/users");
  return { ok: true, message: "Invitation recorded." };
}
