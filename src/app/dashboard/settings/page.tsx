import { requireCurrentUser, getActiveMembership } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLocale, t } from "@/i18n/messages";
import { hasPermission } from "@/modules/identity/permissions";
import { adminText } from "@/modules/administration/messages";
import {
  SettingsForm,
  type SettingsValues,
} from "@/modules/administration/forms";
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>;
}) {
  const locale = getLocale((await searchParams).locale);
  const user = await requireCurrentUser(),
    membership = await getActiveMembership(user.id);
  if (!membership || !hasPermission(membership.roles, "tenant.settings.read"))
    return <p role="alert">{t(locale, "state.permissionDenied")}</p>;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <p role="alert">{adminText(locale, "unavailable")}</p>;
  const { data: settings, error } = await supabase
    .from("tenant_settings")
    .select("country,base_currency,timezone,default_locale,updated_at")
    .eq("tenant_id", membership.tenantId)
    .maybeSingle<SettingsValues & { updated_at: string }>();
  if (error || !settings)
    return <p role="alert">{adminText(locale, "unavailable")}</p>;
  return (
    <section lang={locale}>
      <h1 className="mb-6 text-3xl font-bold">
        {adminText(locale, "settings")}
      </h1>
      {hasPermission(membership.roles, "tenant.settings.write") ? (
        <SettingsForm
          key={membership.tenantId}
          tenantId={membership.tenantId}
          updatedAt={settings.updated_at}
          values={settings}
          locale={locale}
        />
      ) : (
        <dl className="grid gap-4 md:grid-cols-2">
          {[
            ["country", settings.country],
            ["currency", settings.base_currency],
            ["timezone", settings.timezone],
            ["language", settings.default_locale],
          ].map(([key, value]) => (
            <div
              key={key}
              className="rounded-md border border-[var(--border)] bg-white p-5"
            >
              <dt>
                {adminText(
                  locale,
                  key as "country" | "currency" | "timezone" | "language",
                )}
              </dt>
              <dd className="mt-2 font-bold">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
