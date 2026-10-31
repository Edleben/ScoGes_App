import type { Locale } from "@/types/foundation";
import { foundationText } from "@/i18n/foundation-messages";
import { getRequestLocale } from "@/i18n/server";
import { getLocalizedTrackers } from "@/modules/project-tracker/tracker-messages";
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
  trackerCheckpoint,
  type SprintTracker,
} from "@/modules/project-tracker/tracker-data";
import { cn } from "@/lib/utils";

function ProgressBar({ value, locale }: { value: number; locale: Locale }) {
  return (
    <div
      aria-label={`${foundationText(locale, "progress")} ${value}%`}
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

function SprintCard({
  sprint,
  locale,
}: {
  sprint: SprintTracker;
  locale: Locale;
}) {
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
          {getStatusLabel(sprint.status, locale)}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        {sprint.summary}
      </p>

      <div className="mt-5 grid gap-2">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>{foundationText(locale, "sprintProgress")}</span>
          <span>{sprint.progress}%</span>
        </div>
        <ProgressBar locale={locale} value={sprint.progress} />
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
                {getStatusLabel(feature.status, locale)}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar locale={locale} value={feature.progress} />
              <span className="w-12 text-right text-sm font-bold">
                {feature.progress}%
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {foundationText(locale, "domain")}: {feature.ownerArea}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

export default async function ProjectTrackerPage() {
  const locale = await getRequestLocale();
  const sprintTrackers = getLocalizedTrackers(locale);
  const text = (key: Parameters<typeof foundationText>[1]) =>
    foundationText(locale, key);
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
          {text("projectMonitoring")}
        </p>
        <h1 className="mt-2 text-3xl font-bold">{text("trackerTitle")}</h1>
        <p className="mt-2 max-w-3xl text-[var(--muted)]">
          {text("trackerIntro")}
        </p>
      </div>

      <section
        aria-labelledby="sprint0-checkpoint-title"
        className="mb-6 rounded-md border border-[var(--border)] bg-white p-5"
      >
        <h2 id="sprint0-checkpoint-title" className="text-xl font-bold">
          {text("checkpoint")}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {text("dated")}{" "}
          <time dateTime={trackerCheckpoint.validatedOn}>
            {trackerCheckpoint.validatedOn}
          </time>
          . {text("manual")}
        </p>
        <p className="mt-3 font-semibold">
          {completed} {text("delivered")} {sprint0.features.length}
        </p>
        <p className="mt-1 text-sm">
          {sprint0.progress}% : {text("weighted")}
        </p>
        <h3 className="mt-4 font-semibold">{text("next")}</h3>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          {remaining.map((feature) => (
            <li key={feature.id}>
              <span className="font-medium">{feature.title}</span> —{" "}
              {feature.description}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-4 text-sm underline">
          <a href={trackerCheckpoint.validationPr}>{text("validationPr")}</a>
          <a href={trackerCheckpoint.validationRun}>{text("validationRun")}</a>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: text("globalProgress"),
            value: `${summary.progress}%`,
            icon: Activity,
          },
          {
            label: text("sprints"),
            value: String(summary.totalSprints),
            icon: TimerReset,
          },
          {
            label: text("doneFeatures"),
            value: `${summary.doneFeatures}/${summary.totalFeatures}`,
            icon: CheckCircle2,
          },
          {
            label: text("plannedFeatures"),
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
            <h2 className="font-bold">{text("reading")}</h2>
            <p className="text-sm leading-6 text-[var(--muted)]">
              {text("readingDescription")}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5">
        {sprintTrackers.map((sprint) => (
          <SprintCard key={sprint.id} sprint={sprint} locale={locale} />
        ))}
      </div>
    </section>
  );
}
