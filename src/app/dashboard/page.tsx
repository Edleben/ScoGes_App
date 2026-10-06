import Link from "next/link";
import type { Route } from "next";
import { CheckCircle2, Database, LockKeyhole, ShieldCheck, TimerReset } from "lucide-react";
import { getProjectTrackerSummary } from "@/modules/project-tracker/tracker-data";

const cards = [
  {
    title: "Tenant actif",
    description: "Le contexte tenant est resolu cote serveur depuis l'utilisateur authentifie.",
    icon: Database,
  },
  {
    title: "Permissions",
    description: "Les actions sensibles passent par les helpers d'autorisation serveur.",
    icon: LockKeyhole,
  },
  {
    title: "Audit",
    description: "Les evenements critiques de Sprint 0 sont modelises et traces.",
    icon: ShieldCheck,
  },
];

export default function DashboardPage() {
  const trackerSummary = getProjectTrackerSummary();

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
          Fondation
        </p>
        <h1 className="mt-2 text-3xl font-bold">Tableau de bord Sprint 0</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Cette vue confirme les blocs de fondation sans afficher de statistiques financieres
          simulees.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="rounded-md border border-[var(--border)] bg-white p-5" key={card.title}>
              <Icon aria-hidden className="text-[var(--primary)]" size={24} />
              <h2 className="mt-4 text-lg font-bold">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{card.description}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <CheckCircle2 aria-hidden className="mr-2 inline" size={18} />
        Sprint 0 s&apos;arrete a la fondation plateforme. Les modules eleves, facturation et paiements
        restent hors scope.
      </div>

      <section className="mt-6 rounded-md border border-[var(--border)] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <TimerReset aria-hidden className="mt-1 text-[var(--primary)]" size={24} />
            <div>
              <h2 className="text-lg font-bold">Monitoring des sprints</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                {trackerSummary.doneFeatures} features terminees sur {trackerSummary.totalFeatures},
                progression globale {trackerSummary.progress}%.
              </p>
            </div>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--border)] px-4 text-sm font-semibold hover:bg-slate-50"
            href={"/dashboard/project" as Route}
          >
            Ouvrir le tracker
          </Link>
        </div>
      </section>
    </div>
  );
}
