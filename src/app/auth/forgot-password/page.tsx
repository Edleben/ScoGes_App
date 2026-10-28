import { AuthPage, type AuthSearch } from "@/components/auth/auth-page";
export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: AuthSearch;
}) {
  return <AuthPage mode="recovery" searchParams={searchParams} />;
}
