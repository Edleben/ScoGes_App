import Link from "next/link";
import type { Route } from "next";
import { Building2, LayoutDashboard, Settings, TimerReset, Users } from "lucide-react";
import { signOutAction } from "@/modules/identity/actions";
import { Button } from "@/components/ui/button";

const navItems: { href: Route; label: string; icon: typeof LayoutDashboard }[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/project" as Route, label: "Tracker projet", icon: TimerReset },
  { href: "/dashboard/settings", label: "Parametres", icon: Settings },
  { href: "/dashboard/users", label: "Utilisateurs", icon: Users },
];

export function AppShell({
  children,
  tenantName,
  userEmail,
}: {
  children: React.ReactNode;
  tenantName?: string;
  userEmail: string;
}) {
  return (
    <div className="shell-grid min-h-screen">
      <aside className="border-r border-[var(--border)] bg-white px-5 py-6 max-[860px]:border-b max-[860px]:border-r-0">
        <Link className="flex items-center gap-3 font-bold text-slate-950" href="/dashboard">
          <span className="grid size-10 place-items-center rounded-md bg-[var(--primary)] text-white">
            <Building2 aria-hidden size={22} />
          </span>
          <span>EDXSTORE</span>
        </Link>

        <div className="mt-6 rounded-md border border-[var(--border)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Tenant</p>
          <p className="mt-1 truncate text-sm font-semibold">{tenantName ?? "A configurer"}</p>
        </div>

        <nav className="mt-6 grid gap-1" aria-label="Navigation principale">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="flex min-h-16 items-center justify-between border-b border-[var(--border)] bg-white px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Administration
            </p>
            <p className="text-sm text-slate-800">{userEmail}</p>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="secondary">
              Deconnexion
            </Button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-6xl px-5 py-8">{children}</main>
      </div>
    </div>
  );
}
