import { foundationText } from "@/i18n/foundation-messages";
import { getRequestLocale } from "@/i18n/server";
import { localizedPath } from "@/i18n/navigation";
import type { Route } from "next";
import Link from "next/link";

export default async function NotFound() {
  const locale = await getRequestLocale();
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <section className="max-w-md text-center">
        <h1 className="text-3xl font-bold">
          {foundationText(locale, "notFound")}
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          {foundationText(locale, "notFoundDescription")}
        </p>
        <Link
          className="mt-6 inline-block font-semibold text-[var(--primary)]"
          href={localizedPath("/", locale) as Route}
        >
          {foundationText(locale, "home")}
        </Link>
      </section>
    </main>
  );
}
