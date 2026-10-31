import { getRequestLocale } from "@/i18n/server";
import { t } from "@/i18n/messages";
import { foundationText } from "@/i18n/foundation-messages";
import { LanguageLinks } from "@/components/shared/language-links";
import { TenantOnboardingForm } from "@/components/shared/forms";
import { requireCurrentUser } from "@/lib/auth/session";

export default async function OnboardingPage() {
  const locale = await getRequestLocale();
  await requireCurrentUser();

  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <section className="w-full max-w-xl rounded-md border border-[var(--border)] bg-white p-6 shadow-sm">
        <LanguageLinks />
        <h1 className="mt-4 text-2xl font-bold">
          {t(locale, "onboarding.title")}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {foundationText(locale, "onboardingIntro")}
        </p>
        <div className="mt-6">
          <TenantOnboardingForm locale={locale} />
        </div>
      </section>
    </main>
  );
}
