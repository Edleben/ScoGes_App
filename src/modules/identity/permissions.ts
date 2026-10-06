import type { Permission, TenantRole } from "@/types/foundation";

export const rolePermissions: Record<TenantRole, Permission[]> = {
  tenant_admin: [
    "tenant.settings.read",
    "tenant.settings.write",
    "users.read",
    "users.invite",
    "users.manage_roles",
    "users.deactivate",
    "audit.read",
  ],
  finance_manager: ["tenant.settings.read", "users.read", "audit.read"],
  cashier: ["tenant.settings.read"],
  registrar: ["tenant.settings.read", "users.read"],
  auditor: ["tenant.settings.read", "users.read", "audit.read"],
};

export function permissionsForRoles(roles: TenantRole[]) {
  return new Set(roles.flatMap((role) => rolePermissions[role] ?? []));
}

export function hasPermission(roles: TenantRole[], permission: Permission) {
  return permissionsForRoles(roles).has(permission);
}

export function canAssignRole(actorRoles: TenantRole[], targetRole: TenantRole) {
  if (!hasPermission(actorRoles, "users.manage_roles")) {
    return false;
  }

  return targetRole !== "tenant_admin" || actorRoles.includes("tenant_admin");
}
