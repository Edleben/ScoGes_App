import { AuthPage, type AuthSearch } from "@/components/auth/auth-page";
import { getCurrentUser } from "@/lib/auth/session";
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: AuthSearch;
}) {
  return (
    <AuthPage
      mode="reset"
      searchParams={searchParams}
      available={Boolean(await getCurrentUser())}
    />
  );
}
