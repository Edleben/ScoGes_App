export const invitationCookie = "edxstore-invitation";
export const activeTenantCookie = "edxstore-tenant";

// Never accept arbitrary return URLs, protocol-relative paths or encoded URLs.
export function authDestination(input: unknown) {
  return input === "/invitations/accept" || input === "/auth/reset-password"
    ? input
    : "/dashboard";
}
