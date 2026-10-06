import { InviteMemberForm } from "@/components/shared/forms";
import { getActiveMembership, requireCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type MemberRow = {
  id: string;
  status: string;
  profiles: { email: string; full_name: string | null } | null;
};

export default async function UsersPage() {
  const user = await requireCurrentUser();
  const membership = await getActiveMembership(user.id);
  const supabase = await createSupabaseServerClient();

  const { data: members } =
    supabase && membership
      ? await supabase
          .from("memberships")
          .select("id,status,profiles(email,full_name)")
          .eq("tenant_id", membership.tenantId)
          .order("created_at", { ascending: false })
          .returns<MemberRow[]>()
      : { data: [] };

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="text-3xl font-bold">Administration des membres</h1>
        <p className="mt-2 text-[var(--muted)]">
          Les invitations et roles sont controles cote serveur avec le tenant actif.
        </p>

        <div className="mt-6 overflow-hidden rounded-md border border-[var(--border)] bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="p-3">Membre</th>
                <th className="p-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {(members ?? []).length === 0 ? (
                <tr>
                  <td className="p-4 text-[var(--muted)]" colSpan={2}>
                    Aucun membre a afficher.
                  </td>
                </tr>
              ) : (
                members?.map((member) => (
                  <tr className="border-t border-[var(--border)]" key={member.id}>
                    <td className="p-3">
                      <span className="font-semibold">
                        {member.profiles?.full_name ?? member.profiles?.email ?? "Profil incomplet"}
                      </span>
                    </td>
                    <td className="p-3">{member.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <aside>
        <h2 className="mb-3 text-lg font-bold">Inviter un membre</h2>
        <InviteMemberForm />
      </aside>
    </section>
  );
}
