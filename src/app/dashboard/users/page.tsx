import Link from "next/link";
import { InviteMemberForm } from "@/components/shared/forms";
import { getActiveMembership, requireCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLocale, t } from "@/i18n/messages";
import { hasPermission } from "@/modules/identity/permissions";
import { authText } from "@/modules/identity/auth-messages";
import { adminText } from "@/modules/administration/messages";
import {
  MemberRolesForm,
  MemberStatusForm,
} from "@/modules/administration/forms";
import type { MembershipStatus, TenantRole } from "@/types/foundation";

type MemberRow = {
  id: string;
  user_id: string;
  status: MembershipStatus;
  updated_at: string;
  profiles: { email: string; full_name: string | null } | null;
  membership_roles: { roles: { key: TenantRole } | null }[];
};
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string; page?: string }>;
}) {
  const params = await searchParams,
    locale = getLocale(params.locale);
  const page = /^[1-9]\d{0,3}$/.test(params.page ?? "")
    ? Number(params.page)
    : 1;
  const user = await requireCurrentUser(),
    membership = await getActiveMembership(user.id);
  if (!membership || !hasPermission(membership.roles, "users.read"))
    return <p role="alert">{t(locale, "state.permissionDenied")}</p>;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <p role="alert">{adminText(locale, "unavailable")}</p>;
  const { data, error } = await supabase
    .from("memberships")
    .select(
      "id,user_id,status,updated_at,profiles(email,full_name),membership_roles(roles(key))",
    )
    .eq("tenant_id", membership.tenantId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range((page - 1) * 20, page * 20)
    .returns<MemberRow[]>();
  if (error || !data)
    return <p role="alert">{adminText(locale, "unavailable")}</p>;
  const members = data.slice(0, 20);
  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_320px]" lang={locale}>
      <div>
        <h1 className="text-3xl font-bold">{adminText(locale, "members")}</h1>
        <div className="mt-6 overflow-x-auto rounded-md border border-[var(--border)] bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th scope="col" className="p-3">
                  {adminText(locale, "member")}
                </th>
                <th scope="col" className="p-3">
                  {adminText(locale, "status")}
                </th>
                <th scope="col" className="p-3">
                  {adminText(locale, "controls")}
                </th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-4">
                    {adminText(locale, "empty")}
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const roles = member.membership_roles.flatMap((item) =>
                    item.roles ? [item.roles.key] : [],
                  );
                  const revision = {
                    tenantId: membership.tenantId,
                    membershipId: member.id,
                    updatedAt: member.updated_at,
                    locale,
                  };
                  return (
                    <tr
                      key={member.id}
                      className="border-t border-[var(--border)]"
                    >
                      <th scope="row" className="p-3 align-top">
                        {member.profiles?.full_name ||
                          member.profiles?.email ||
                          member.id}
                        <div className="font-normal">
                          {roles
                            .map((role) => authText(locale, role))
                            .join(", ")}
                        </div>
                      </th>
                      <td className="p-3 align-top">
                        {adminText(locale, member.status)}
                      </td>
                      <td className="grid gap-4 p-3">
                        {member.status === "active" &&
                          hasPermission(
                            membership.roles,
                            "users.manage_roles",
                          ) && <MemberRolesForm {...revision} roles={roles} />}
                        {hasPermission(
                          membership.roles,
                          "users.deactivate",
                        ) && (
                          <>
                            {member.status === "active" && (
                              <MemberStatusForm
                                {...revision}
                                status="inactive"
                              />
                            )}
                            {["active", "inactive"].includes(member.status) && (
                              <MemberStatusForm
                                {...revision}
                                status="revoked"
                              />
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <nav
          className="mt-4 flex gap-6"
          aria-label={adminText(locale, "members")}
        >
          {page > 1 && (
            <Link href={`/dashboard/users?locale=${locale}&page=${page - 1}`}>
              {adminText(locale, "previous")}
            </Link>
          )}
          {data.length > 20 && (
            <Link href={`/dashboard/users?locale=${locale}&page=${page + 1}`}>
              {adminText(locale, "next")}
            </Link>
          )}
        </nav>
      </div>
      {hasPermission(membership.roles, "users.invite") &&
        hasPermission(membership.roles, "users.manage_roles") && (
          <aside>
            <h2 className="mb-3 text-lg font-bold">
              {adminText(locale, "invite")}
            </h2>
            <InviteMemberForm locale={locale} />
          </aside>
        )}
    </section>
  );
}
