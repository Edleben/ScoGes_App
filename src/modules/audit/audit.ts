import type { AuditAction } from "@/types/foundation";

export type AuditEventInput = {
  tenantId: string | null;
  actorUserId: string;
  action: AuditAction;
  targetType: string;
  targetId: string | null;
  metadata?: Record<string, string | number | boolean | null>;
  requestId?: string;
};

export function sanitizeAuditMetadata(metadata: AuditEventInput["metadata"] = {}) {
  const blocked = new Set(["password", "token", "secret", "cookie", "authorization"]);

  return Object.fromEntries(
    Object.entries(metadata).filter(([key]) => !blocked.has(key.toLowerCase())),
  );
}
