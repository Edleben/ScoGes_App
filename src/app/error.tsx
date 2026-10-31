"use client";
import { foundationText } from "@/i18n/foundation-messages";
import { useLocale } from "@/i18n/locale-context";

export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const locale = useLocale();
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <section className="max-w-md text-center">
        <h1 className="text-3xl font-bold">
          {foundationText(locale, "errorTitle")}
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          {foundationText(locale, "errorDescription")}
        </p>
        <button
          className="mt-6 rounded-md bg-[var(--primary)] px-4 py-2 font-semibold text-white"
          onClick={reset}
          type="button"
        >
          {foundationText(locale, "retry")}
        </button>
      </section>
    </main>
  );
}
