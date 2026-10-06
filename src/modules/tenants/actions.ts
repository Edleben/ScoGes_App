"use server";

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
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const parsed = tenantOnboardingSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    country: formData.get("country"),
    baseCurrency: formData.get("baseCurrency"),
    timezone: formData.get("timezone"),
    defaultLocale: formData.get("defaultLocale"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Invalid tenant data." };
  }

  const { data, error } = await supabase.rpc("create_tenant_with_admin", {
    tenant_name: parsed.data.name,
    tenant_slug: parsed.data.slug,
    tenant_country: parsed.data.country,
    tenant_base_currency: parsed.data.baseCurrency,
    tenant_timezone: parsed.data.timezone,
    tenant_default_locale: parsed.data.defaultLocale,
    actor_user_id: user.id,
  });

  if (error || !data) {
    return { ok: false, message: error?.message ?? "Tenant creation failed." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
