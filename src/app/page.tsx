import { foundationText } from "@/i18n/foundation-messages";
import { getRequestLocale } from "@/i18n/server";
import { localizedPath } from "@/i18n/navigation";
import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const locale = await getRequestLocale();
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto grid min-h-screen max-w-6xl content-center gap-10 px-5 py-16">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
            <ShieldCheck aria-hidden size={18} />
            Sprint 0
          </div>
          <h1 className="text-4xl font-bold leading-tight text-slate-950 md:text-6xl">
            {foundationText(locale, "homeTitle")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            {foundationText(locale, "homeDescription")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={localizedPath("/login", locale) as Route}>
              <Button>
                {foundationText(locale, "access")}
                <ArrowRight aria-hidden size={18} />
              </Button>
            </Link>
            <Link href={localizedPath("/dashboard", locale) as Route}>
              <Button variant="secondary">
                {foundationText(locale, "viewDashboard")}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
