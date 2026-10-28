import { AuthPage, type AuthSearch } from "@/components/auth/auth-page";
export default function SignupPage({
  searchParams,
}: {
  searchParams: AuthSearch;
}) {
  return <AuthPage mode="signup" searchParams={searchParams} />;
}
