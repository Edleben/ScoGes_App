export type Locale = "fr" | "en";

export type TenantRole =
  | "tenant_admin"
  | "finance_manager"
  | "cashier"
  | "registrar"
  | "auditor";

export type Permission =
  | "tenant.settings.read"
  | "tenant.settings.write"
  | "users.read"
  | "users.invite"
  | "users.manage_roles"
  | "users.deactivate"
  | "audit.read";

export type MembershipStatus = "active" | "invited" | "inactive" | "revoked";

export type AuthUser = {
  id: string;
  email: string;
  isPlatformAdmin?: boolean;
};

export type Membership = {
  id: string;
  tenantId: string;
  userId: string;
  status: MembershipStatus;
  roles: TenantRole[];
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  country: string;
  baseCurrency: string;
  timezone: string;
  defaultLocale: Locale;
};

export type AuditAction =
  | "tenant.created"
  | "tenant.settings.updated"
  | "member.invited"
  | "member.role_changed"
  | "member.deactivated";
