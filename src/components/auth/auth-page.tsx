import Link from "next/link";
import type { Route } from "next";
import { getLocale } from "@/i18n/messages";
import { authDestination } from "@/modules/identity/auth-navigation";
import {
  authText,
  type AuthMessageKey,
} from "@/modules/identity/auth-messages";
import { AuthForm, AuthLanguageLinks, type AuthFormMode } from "./auth-form";
import type { Locale } from "@/types/foundation";

export type AuthSearch = Promise<{
  locale?: string;
  next?: string;
  notice?: string;
}>;
export function AuthFrame({
  title,
  locale,
  path,
  next = "/dashboard",
  children,
}: {
  title: AuthMessageKey;
  locale: Locale;
  path: string;
  next?: string;
  children: React.ReactNode;
}) {
  return (
    <main
      className="grid min-h-screen place-items-center px-5 py-12"
      lang={locale}
    >
      <section className="w-full max-w-md rounded-md border border-[var(--border)] bg-white p-6 shadow-sm">
        <nav
          aria-label={locale === "fr" ? "Langue" : "Language"}
          className="mb-5 flex gap-4 text-sm"
        >
          <AuthLanguageLinks path={path} next={next} />
        </nav>
        <h1 className="mb-6 text-2xl font-bold">{authText(locale, title)}</h1>
        {children}
      </section>
    </main>
  );
}

export async function AuthPage({
  mode,
  searchParams,
  available = true,
}: {
  mode: Extract<AuthFormMode, "login" | "signup" | "recovery" | "reset">;
  searchParams: AuthSearch;
  available?: boolean;
}) {
  const query = await searchParams;
  const locale = getLocale(query.locale);
  const next = authDestination(query.next);
  const path =
    mode === "login"
      ? "/login"
      : mode === "signup"
        ? "/signup"
        : mode === "reset"
          ? "/auth/reset-password"
          : "/auth/forgot-password";
  const notice =
    query.notice === "invalidLink" || query.notice === "passwordUpdated"
      ? query.notice
      : null;
  return (
    <AuthFrame title={mode} locale={locale} path={path} next={next}>
      {notice && (
        <p role="status" className="mb-4">
          {authText(locale, notice)}
        </p>
      )}
      {available ? (
        <AuthForm mode={mode} locale={locale} next={next} />
      ) : (
        <p role="status">{authText(locale, "invalidLink")}</p>
      )}
      <nav className="mt-5 grid gap-3 text-sm">
        {mode !== "login" && (
          <Link
            href={
              `/login?locale=${locale}&next=${encodeURIComponent(next)}` as Route
            }
          >
            {authText(locale, "login")}
          </Link>
        )}
        {mode === "login" && (
          <>
            <Link
              href={
                `/signup?locale=${locale}&next=${encodeURIComponent(next)}` as Route
              }
            >
              {authText(locale, "signup")}
            </Link>
            <Link href={`/auth/forgot-password?locale=${locale}` as Route}>
              {authText(locale, "recovery")}
            </Link>
          </>
        )}
        {mode === "reset" && (
          <Link href={`/auth/forgot-password?locale=${locale}` as Route}>
            {authText(locale, "recovery")}
          </Link>
        )}
      </nav>
    </AuthFrame>
  );
}
