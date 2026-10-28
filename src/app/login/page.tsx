import { AuthPage, type AuthSearch } from "@/components/auth/auth-page";
export default function LoginPage({
  searchParams,
}: {
  searchParams: AuthSearch;
}) {
  return <AuthPage mode="login" searchParams={searchParams} />;
}
