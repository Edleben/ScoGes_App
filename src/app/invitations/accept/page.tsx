import Link from "next/link";
import { cookies } from "next/headers";
import { AuthFrame, type AuthSearch } from "@/components/auth/auth-page";
import { AuthForm, InvitationEntry } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/i18n/messages";
import { authText } from "@/modules/identity/auth-messages";
import { invitationCookie } from "@/modules/identity/auth-navigation";
import { signOutAction } from "@/modules/identity/actions";
import { Button } from "@/components/ui/button";

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: AuthSearch;
}) {
  const locale = getLocale((await searchParams).locale);
  const hasInvitation = (await cookies()).has(invitationCookie);
  const user = hasInvitation ? await getCurrentUser() : null;
  return (
    <AuthFrame
      title="invitation"
      locale={locale}
      path="/invitations/accept"
      next="/invitations/accept"
    >
      <InvitationEntry locale={locale}>
        {!hasInvitation ? (
          <AuthForm mode="capture" locale={locale} />
        ) : user ? (
          <>
            <p className="mb-4">{user.email}</p>
            <AuthForm mode="accept" locale={locale} />
            <form action={signOutAction} className="mt-4">
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="secondary">
                {authText(locale, "signout")}
              </Button>
            </form>
          </>
        ) : (
          <div className="grid gap-4">
            <p>{authText(locale, "invitedEmail")}</p>
            <Link href={`/login?next=/invitations/accept&locale=${locale}`}>
              {authText(locale, "login")}
            </Link>
            <Link href={`/signup?next=/invitations/accept&locale=${locale}`}>
              {authText(locale, "signup")}
            </Link>
          </div>
        )}
      </InvitationEntry>
    </AuthFrame>
  );
}
