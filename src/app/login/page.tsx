import { SignInForm } from "@/components/shared/forms";
import { requestPasswordResetAction } from "@/modules/identity/actions";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <section className="w-full max-w-md rounded-md border border-[var(--border)] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Connexion</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Authentification Supabase. Configurez les variables d&apos;environnement pour activer le flux
          reel.
        </p>
        <div className="mt-6">
          <SignInForm />
        </div>
        <form action={requestPasswordResetAction} className="mt-4">
          <input name="email" type="hidden" value="" />
          <button className="text-sm font-semibold text-[var(--primary)]" type="submit">
            Demander une reinitialisation
          </button>
        </form>
      </section>
    </main>
  );
}
