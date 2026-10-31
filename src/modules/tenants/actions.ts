"use server";
import { localizedPath } from "@/i18n/navigation";

import { z } from "zod";
import { getLocale, t } from "@/i18n/messages";
import { authText } from "@/modules/identity/auth-messages";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { tenantOnboardingSchema } from "@/modules/tenants/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentUser } from "@/lib/auth/session";

export type ActionState = {
  ok: boolean;
  message?: string;
};

export async function createTenantAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireCurrentUser();
  const locale = getLocale(String(formData.get("locale") ?? "fr"));
  const unavailable = () => ({
    ok: false,
    message: authText(locale, "unavailable"),
  });

  const parsed = tenantOnboardingSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    country: formData.get("country"),
    baseCurrency: formData.get("baseCurrency"),
    timezone: formData.get("timezone"),
    defaultLocale: formData.get("defaultLocale"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: t(locale, "onboarding.invalid"),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return unavailable();
    const { data, error } = await supabase.rpc("create_tenant_with_admin", {
      tenant_name: parsed.data.name,
      tenant_slug: parsed.data.slug,
      tenant_country: parsed.data.country,
      tenant_base_currency: parsed.data.baseCurrency,
      tenant_timezone: parsed.data.timezone,
      tenant_default_locale: parsed.data.defaultLocale,
      actor_user_id: user.id,
    });
    if (error?.code === "23505")
      return {
        ok: false,
        message: t(locale, "onboarding.slugUsed"),
      };
    if (error || !z.string().uuid().safeParse(data).success)
      return unavailable();
  } catch {
    return unavailable();
  }

  revalidatePath("/dashboard");
  redirect(localizedPath("/dashboard", locale));
}
