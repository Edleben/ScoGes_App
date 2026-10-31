import { foundationText } from "@/i18n/foundation-messages";
import { getRequestLocale } from "@/i18n/server";
import { localizedPath } from "@/i18n/navigation";
import Link from "next/link";
import type { Route } from "next";
import {
  CheckCircle2,
  Database,
  LockKeyhole,
  ShieldCheck,
  TimerReset,
} from "lucide-react";
import { getProjectTrackerSummary } from "@/modules/project-tracker/tracker-data";

const cards = [
  {
    title: "activeTenant",
    description: "tenantDescription",
    icon: Database,
  },
  {
    title: "permissions",
    description: "permissionDescription",
    icon: LockKeyhole,
  },
  {
    title: "audit",
    description: "auditDescription",
    icon: ShieldCheck,
  },
] as const;

export default async function DashboardPage() {
  const locale = await getRequestLocale();
  const text = (key: Parameters<typeof foundationText>[1]) =>
    foundationText(locale, key);
  const trackerSummary = getProjectTrackerSummary();

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
          {text("foundation")}
        </p>
        <h1 className="mt-2 text-3xl font-bold">{text("dashboard")}</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          {text("dashboardIntro")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              className="rounded-md border border-[var(--border)] bg-white p-5"
              key={card.title}
            >
              <Icon aria-hidden className="text-[var(--primary)]" size={24} />
              <h2 className="mt-4 text-lg font-bold">{text(card.title)}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {text(card.description)}
              </p>
            </article>
          );
        })}
      </div>

      <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <CheckCircle2 aria-hidden className="mr-2 inline" size={18} />
        {text("scope")}
      </div>

      <section className="mt-6 rounded-md border border-[var(--border)] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <TimerReset
              aria-hidden
              className="mt-1 text-[var(--primary)]"
              size={24}
            />
            <div>
              <h2 className="text-lg font-bold">{text("monitoring")}</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                {trackerSummary.doneFeatures} {text("completed")}{" "}
                {trackerSummary.totalFeatures}, {text("overall")}{" "}
                {trackerSummary.progress}%.
              </p>
            </div>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--border)] px-4 text-sm font-semibold hover:bg-slate-50"
            href={localizedPath("/dashboard/project", locale) as Route}
          >
            {text("openTracker")}
          </Link>
        </div>
      </section>
    </div>
  );
}
