import { foundationText } from "@/i18n/foundation-messages";
import { t, type MessageKey } from "@/i18n/messages";
import { localizedPath } from "@/i18n/navigation";
import { LanguageLinks } from "./language-links";
import type { Locale } from "@/types/foundation";
import Link from "next/link";
import type { Route } from "next";
import {
  Building2,
  LayoutDashboard,
  Settings,
  TimerReset,
  Users,
} from "lucide-react";
import { signOutAction } from "@/modules/identity/actions";
import { Button } from "@/components/ui/button";

const navItems: {
  href: Route;
  label: MessageKey | "project";
  icon: typeof LayoutDashboard;
}[] = [
  { href: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard },
  { href: "/dashboard/project" as Route, label: "project", icon: TimerReset },
  { href: "/dashboard/settings", label: "nav.settings", icon: Settings },
  { href: "/dashboard/users", label: "nav.users", icon: Users },
];

export function AppShell({
  children,
  locale,
  tenantName,
  userEmail,
}: {
  children: React.ReactNode;
  locale: Locale;
  tenantName?: string;
  userEmail: string;
}) {
  return (
    <div className="shell-grid min-h-screen">
      <aside className="border-r border-[var(--border)] bg-white px-5 py-6 max-[860px]:border-b max-[860px]:border-r-0">
        <Link
          className="flex items-center gap-3 font-bold text-slate-950"
          href={localizedPath("/dashboard", locale) as Route}
        >
          <span className="grid size-10 place-items-center rounded-md bg-[var(--primary)] text-white">
            <Building2 aria-hidden size={22} />
          </span>
          <span>EDXSTORE</span>
        </Link>

        <div className="mt-6 rounded-md border border-[var(--border)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            {foundationText(locale, "tenant")}
          </p>
          <p className="mt-1 truncate text-sm font-semibold">
            {tenantName ?? foundationText(locale, "configure")}
          </p>
        </div>

        <nav
          className="mt-6 grid gap-1"
          aria-label={foundationText(locale, "navigation")}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                href={localizedPath(item.href, locale) as Route}
                key={item.href}
              >
                <Icon aria-hidden size={18} />
                {item.label === "project"
                  ? foundationText(locale, "project")
                  : t(locale, item.label)}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="flex min-h-16 items-center justify-between border-b border-[var(--border)] bg-white px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              {foundationText(locale, "admin")}
            </p>
            <p className="text-sm text-slate-800">{userEmail}</p>
          </div>
          <LanguageLinks />
          <form action={signOutAction}>
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="secondary">
              {foundationText(locale, "signout")}
            </Button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-6xl px-5 py-8">{children}</main>
      </div>
    </div>
  );
}
