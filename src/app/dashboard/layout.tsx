import { getRequestLocale } from "@/i18n/server";
import { localizedPath } from "@/i18n/navigation";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shared/app-shell";
import { getActiveMembership, requireCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();
  const user = await requireCurrentUser();
  const membership = await getActiveMembership(user.id);

  if (!membership) {
    redirect(localizedPath("/onboarding", locale));
  }

  const supabase = await createSupabaseServerClient();
  const { data: tenant } = supabase
    ? await supabase
        .from("tenants")
        .select("name")
        .eq("id", membership.tenantId)
        .maybeSingle<{ name: string }>()
    : { data: null };

  return (
    <AppShell locale={locale} tenantName={tenant?.name} userEmail={user.email}>
      {children}
    </AppShell>
  );
}
