"use server";
import { localizedPath } from "@/i18n/navigation";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAppUrl } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  emailSchema,
  passwordSchema,
  signInSchema,
  signUpSchema,
} from "./schemas";
import {
  activeTenantCookie,
  authDestination,
  invitationCookie,
} from "./auth-navigation";
import { authReply, formLocale, type AuthActionState } from "./auth-state";
export type { AuthActionState } from "./auth-state";

function callbackUrl(form: FormData, next: string) {
  const url = new URL("/auth/callback", getAppUrl());
  url.searchParams.set("next", next);
  url.searchParams.set("locale", formLocale(form));
  return url.toString();
}

export async function signInAction(
  _: AuthActionState,
  form: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return authReply(form, false, "invalid");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return authReply(form, false, "unavailable");
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return authReply(form, false, "credentials");
  const pendingInvitation = (await cookies()).has(invitationCookie);
  redirect(
    localizedPath(
      pendingInvitation
        ? "/invitations/accept"
        : authDestination(form.get("next")),
      formLocale(form),
    ),
  );
}

export async function signUpAction(
  _: AuthActionState,
  form: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return authReply(form, false, "invalid");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return authReply(form, false, "unavailable");
  const destination = (await cookies()).has(invitationCookie)
    ? "/invitations/accept"
    : authDestination(form.get("next"));
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: callbackUrl(form, destination),
      data: { preferred_locale: formLocale(form) },
    },
  });
  if (
    error &&
    !["user_already_exists", "email_exists"].includes(error.code ?? "")
  )
    return authReply(form, false, "unavailable");
  if (data.session) redirect(localizedPath(destination, formLocale(form)));
  return authReply(form, true, "checkEmail");
}

export async function requestPasswordResetAction(
  _: AuthActionState,
  form: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return authReply(form, false, "invalid");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return authReply(form, false, "unavailable");
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: callbackUrl(form, "/auth/reset-password") },
  );
  if (error && error.code !== "user_not_found")
    return authReply(form, false, "unavailable");
  return authReply(form, true, "checkEmail");
}

export async function updatePasswordAction(
  _: AuthActionState,
  form: FormData,
): Promise<AuthActionState> {
  const parsed = passwordSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return authReply(form, false, "invalid");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return authReply(form, false, "unavailable");
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user?.email_confirmed_at)
    return authReply(form, false, "invalidLink");
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return authReply(form, false, "unavailable");
  const { error: signOutError } = await supabase.auth.signOut({
    scope: "global",
  });
  if (signOutError) return authReply(form, false, "passwordSignoutFailed");
  (await cookies()).delete(activeTenantCookie);
  redirect(`/login?notice=passwordUpdated&locale=${formLocale(form)}`);
}

export async function signOutAction(form: FormData) {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error("Unable to sign out. Please retry.");
  }
  const store = await cookies();
  store.delete(invitationCookie);
  store.delete(activeTenantCookie);
  redirect(localizedPath("/login", formLocale(form)));
}
