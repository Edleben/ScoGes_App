"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <section className="max-w-md text-center">
        <h1 className="text-3xl font-bold">Une erreur est survenue</h1>
        <p className="mt-3 text-[var(--muted)]">
          L&apos;action n&apos;a pas pu etre terminee. Vous pouvez reessayer.
        </p>
        <button
          className="mt-6 rounded-md bg-[var(--primary)] px-4 py-2 font-semibold text-white"
          onClick={reset}
          type="button"
        >
          Reessayer
        </button>
      </section>
    </main>
  );
}
