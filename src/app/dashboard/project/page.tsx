import {
  Activity,
  CheckCircle2,
  CircleDashed,
  ListChecks,
  TimerReset,
} from "lucide-react";
import {
  getProjectTrackerSummary,
  getStatusClassName,
  getStatusLabel,
  sprintTrackers,
  trackerCheckpoint,
  type SprintTracker,
} from "@/modules/project-tracker/tracker-data";
import { cn } from "@/lib/utils";

function ProgressBar({ value }: { value: number }) {
  return (
    <div
      aria-label={`Progression ${value}%`}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={value}
      className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
      role="progressbar"
    >
      <div
        className="h-full rounded-full bg-[var(--primary)]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function SprintCard({ sprint }: { sprint: SprintTracker }) {
  return (
    <article className="rounded-md border border-[var(--border)] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
            {sprint.label}
          </p>
          <h2 className="mt-1 text-xl font-bold">{sprint.objective}</h2>
        </div>
        <span
          className={cn(
            "rounded-md border px-2.5 py-1 text-xs font-bold",
            getStatusClassName(sprint.status),
          )}
        >
          {getStatusLabel(sprint.status)}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        {sprint.summary}
      </p>

      <div className="mt-5 grid gap-2">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>Progression du sprint</span>
          <span>{sprint.progress}%</span>
        </div>
        <ProgressBar value={sprint.progress} />
      </div>

      <div className="mt-5 grid gap-3">
        {sprint.features.map((feature) => (
          <div
            className="rounded-md border border-[var(--border)] p-3"
            key={feature.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  {feature.description}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-md border px-2 py-1 text-xs font-bold",
                  getStatusClassName(feature.status),
                )}
              >
                {getStatusLabel(feature.status)}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar value={feature.progress} />
              <span className="w-12 text-right text-sm font-bold">
                {feature.progress}%
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Domaine: {feature.ownerArea}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function ProjectTrackerPage() {
  const summary = getProjectTrackerSummary();
  const sprint0 = sprintTrackers[0];
  const completed = sprint0.features.filter(
    (feature) => feature.status === "done",
  ).length;
  const remaining = sprint0.features.filter(
    (feature) => feature.status !== "done",
  );

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
          Monitoring projet
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          Tracker des sprints et features
        </h1>
        <p className="mt-2 max-w-3xl text-[var(--muted)]">
          Tableau de pilotage pour suivre ce qui est livre, ce qui reste a
          faire, et la progression quantitative de chaque sprint sans demarrer
          les travaux des sprints suivants.
        </p>
      </div>

      <section
        aria-labelledby="sprint0-checkpoint-title"
        className="mb-6 rounded-md border border-[var(--border)] bg-white p-5"
      >
        <h2 id="sprint0-checkpoint-title" className="text-xl font-bold">
          État de validation — Sprint 0
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Point daté du{" "}
          <time dateTime={trackerCheckpoint.validatedOn}>
            {trackerCheckpoint.validatedOn}
          </time>
          . Checklist manuelle de livraison; la validation finale du sprint
          reste ouverte.
        </p>
        <p className="mt-3 font-semibold">
          {completed} jalons livrés sur {sprint0.features.length}
        </p>
        <p className="mt-1 text-sm">
          {sprint0.progress}% : moyenne non pondérée des jalons. Les tests
          réussis ne valident pas les parcours encore ouverts.
        </p>
        <h3 className="mt-4 font-semibold">Prochaines actions de Sprint 0</h3>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          {remaining.map((feature) => (
            <li key={feature.id}>
              <span className="font-medium">{feature.title}</span> —{" "}
              {feature.description}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-4 text-sm underline">
          <a href={trackerCheckpoint.validationPr}>
            Validation des parcours (PR #3)
          </a>
          <a href={trackerCheckpoint.validationRun}>
            Résultats CI du point de validation
          </a>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Progression globale",
            value: `${summary.progress}%`,
            icon: Activity,
          },
          {
            label: "Sprints suivis",
            value: String(summary.totalSprints),
            icon: TimerReset,
          },
          {
            label: "Features terminees",
            value: `${summary.doneFeatures}/${summary.totalFeatures}`,
            icon: CheckCircle2,
          },
          {
            label: "Features planifiees",
            value: String(summary.plannedFeatures),
            icon: CircleDashed,
          },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <article
              className="rounded-md border border-[var(--border)] bg-white p-5"
              key={metric.label}
            >
              <Icon aria-hidden className="text-[var(--primary)]" size={22} />
              <p className="mt-4 text-sm font-semibold text-[var(--muted)]">
                {metric.label}
              </p>
              <p className="mt-1 text-3xl font-bold">{metric.value}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-6 rounded-md border border-[var(--border)] bg-white p-5">
        <div className="flex items-center gap-3">
          <ListChecks aria-hidden className="text-[var(--primary)]" size={22} />
          <div>
            <h2 className="font-bold">Lecture du tracker</h2>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Les pourcentages suivent une checklist manuelle de jalons
              techniques. Ils ne mesurent ni la couverture de tests ni une
              aptitude à la production. Les détails ouverts restent visibles et
              doivent être réévalués après chaque livraison vérifiée.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5">
        {sprintTrackers.map((sprint) => (
          <SprintCard key={sprint.id} sprint={sprint} />
        ))}
      </div>
    </section>
  );
}
