"use server";
import { localizedPath } from "@/i18n/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createHash } from "node:crypto";
import { getAppUrl } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createEmailProvider } from "@/lib/email/smtp";
import { getActiveMembership, requireCurrentUser } from "@/lib/auth/session";
import { hasPermission, canAssignRole } from "./permissions";
import { invitationTokenSchema, inviteMemberSchema } from "./schemas";
import { activeTenantCookie, invitationCookie } from "./auth-navigation";
import { authReply, formLocale, type AuthActionState } from "./auth-state";

export async function inviteMemberAction(
  _: AuthActionState,
  form: FormData,
): Promise<AuthActionState> {
  const user = await requireCurrentUser();
  const membership = await getActiveMembership(user.id);
  const parsed = inviteMemberSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return authReply(form, false, "invalid");
  if (
    !membership ||
    !hasPermission(membership.roles, "users.invite") ||
    !canAssignRole(membership.roles, parsed.data.role)
  )
    return authReply(form, false, "denied");
  const emailProvider = createEmailProvider();
  if (!emailProvider) return authReply(form, false, "smtpMissing");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return authReply(form, false, "unavailable");
  const { data, error } = await supabase.rpc("issue_tenant_invitation", {
    target_tenant_id: membership.tenantId,
    invitee_email: parsed.data.email,
    role_key: parsed.data.role,
  });
  const issued = z
    .object({ id: z.string().uuid(), token: invitationTokenSchema })
    .safeParse(data);
  if (error || !issued.success) return authReply(form, false, "inviteFailed");
  const url = new URL("/invitations/accept", getAppUrl());
  url.searchParams.set("locale", formLocale(form));
  url.hash = new URLSearchParams({ token: issued.data.token }).toString();
  let delivered = true;
  try {
    await emailProvider.sendInvitation({
      email: parsed.data.email,
      url: url.toString(),
      locale: formLocale(form),
    });
  } catch {
    delivered = false;
  }
  const { error: recordError } = await supabase.rpc(
    "record_invitation_delivery",
    {
      invitation_id: issued.data.id,
      token_digest: createHash("sha256")
        .update(issued.data.token)
        .digest("hex"),
      delivered,
    },
  );
  revalidatePath("/dashboard/users");
  if (recordError) return authReply(form, false, "unavailable");
  return authReply(form, delivered, delivered ? "delivered" : "deliveryFailed");
}

export async function captureInvitationAction(
  _: AuthActionState,
  form: FormData,
): Promise<AuthActionState> {
  const parsed = invitationTokenSchema.safeParse(form.get("token"));
  if (!parsed.success) return authReply(form, false, "invalidLink");
  (await cookies()).set(invitationCookie, parsed.data, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 3600,
  });
  redirect(`/invitations/accept?locale=${formLocale(form)}`);
}

export async function acceptInvitationAction(
  _: AuthActionState,
  form: FormData,
): Promise<AuthActionState> {
  await requireCurrentUser();
  const store = await cookies();
  const token = invitationTokenSchema.safeParse(
    store.get(invitationCookie)?.value,
  );
  if (!token.success) return authReply(form, false, "invalidLink");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return authReply(form, false, "unavailable");
  const { data, error } = await supabase.rpc("accept_tenant_invitation", {
    invitation_token: token.data,
  });
  const accepted = z.object({ tenant_id: z.string().uuid() }).safeParse(data);
  if (error || !accepted.success)
    return authReply(form, false, "acceptanceFailed");
  store.delete(invitationCookie);
  store.set(activeTenantCookie, accepted.data.tenant_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/dashboard", "layout");
  redirect(localizedPath("/dashboard", formLocale(form)));
}
