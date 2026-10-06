import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <section className="max-w-md text-center">
        <h1 className="text-3xl font-bold">Page introuvable</h1>
        <p className="mt-3 text-[var(--muted)]">La page demandee n&apos;existe pas.</p>
        <Link className="mt-6 inline-block font-semibold text-[var(--primary)]" href="/">
          Retour a l&apos;accueil
        </Link>
      </section>
    </main>
  );
}
