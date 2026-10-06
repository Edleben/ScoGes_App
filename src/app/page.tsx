import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto grid min-h-screen max-w-6xl content-center gap-10 px-5 py-16">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
            <ShieldCheck aria-hidden size={18} />
            Sprint 0
          </div>
          <h1 className="text-4xl font-bold leading-tight text-slate-950 md:text-6xl">
            EDXSTORE School Management SaaS
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Fondation multi-tenant pour gerer les institutions, les utilisateurs, les permissions,
            l&apos;audit et l&apos;onboarding avant les modules metier des prochains sprints.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login">
              <Button>
                Acceder a la plateforme
                <ArrowRight aria-hidden size={18} />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary">Voir le tableau de bord</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
