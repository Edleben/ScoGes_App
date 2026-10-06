import { TenantOnboardingForm } from "@/components/shared/forms";
import { requireCurrentUser } from "@/lib/auth/session";

export default async function OnboardingPage() {
  await requireCurrentUser();

  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <section className="w-full max-w-xl rounded-md border border-[var(--border)] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Creer votre institution</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Cette action cree le tenant, ses parametres, votre role administrateur et un evenement
          d&apos;audit.
        </p>
        <div className="mt-6">
          <TenantOnboardingForm />
        </div>
      </section>
    </main>
  );
}
