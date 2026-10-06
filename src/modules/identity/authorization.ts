import { hasPermission } from "@/modules/identity/permissions";
import type { AuthUser, Membership, Permission } from "@/types/foundation";

export class AuthorizationError extends Error {
  constructor(message = "Permission denied") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function requireUser(user: AuthUser | null | undefined): AuthUser {
  if (!user) {
    throw new AuthorizationError("Authentication required");
  }

  return user;
}

export function requireMembership(
  user: AuthUser,
  membership: Membership | null | undefined,
  tenantId: string,
) {
  if (user.isPlatformAdmin) {
    return membership ?? null;
  }

  if (!membership || membership.userId !== user.id || membership.tenantId !== tenantId) {
    throw new AuthorizationError("Tenant membership required");
  }

  if (membership.status !== "active") {
    throw new AuthorizationError("Active tenant membership required");
  }

  return membership;
}

export function requirePermission(
  user: AuthUser,
  membership: Membership | null | undefined,
  tenantId: string,
  permission: Permission,
) {
  const resolvedMembership = requireMembership(user, membership, tenantId);

  if (user.isPlatformAdmin) {
    return;
  }

  if (!resolvedMembership || !hasPermission(resolvedMembership.roles, permission)) {
    throw new AuthorizationError("Missing required permission");
  }
}
