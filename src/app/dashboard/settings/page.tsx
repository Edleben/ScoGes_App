import { requireCurrentUser, getActiveMembership } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const user = await requireCurrentUser();
  const membership = await getActiveMembership(user.id);
  const supabase = await createSupabaseServerClient();

  const { data: settings } =
    supabase && membership
      ? await supabase
          .from("tenant_settings")
          .select("country,base_currency,timezone,default_locale")
          .eq("tenant_id", membership.tenantId)
          .maybeSingle<{
            country: string;
            base_currency: string;
            timezone: string;
            default_locale: string;
          }>()
      : { data: null };

  return (
    <section>
      <h1 className="text-3xl font-bold">Parametres du tenant</h1>
      <p className="mt-2 text-[var(--muted)]">
        Lecture des parametres institutionnels de base. La modification est reservee aux actions
        controlees par permission.
      </p>

      <dl className="mt-6 grid gap-4 md:grid-cols-2">
        {[
          ["Pays", settings?.country ?? "Non configure"],
          ["Devise", settings?.base_currency ?? "Non configuree"],
          ["Fuseau horaire", settings?.timezone ?? "Non configure"],
          ["Langue", settings?.default_locale ?? "fr"],
        ].map(([label, value]) => (
          <div className="rounded-md border border-[var(--border)] bg-white p-5" key={label}>
            <dt className="text-sm font-semibold text-[var(--muted)]">{label}</dt>
            <dd className="mt-2 text-lg font-bold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
