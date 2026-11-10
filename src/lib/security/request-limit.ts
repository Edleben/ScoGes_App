import "server-only";
import { headers } from "next/headers";
import { checkRateLimit, ingressIdentity, type LimitScope } from "./rate-limit";

export async function requestLimit(scope: LimitScope, userId?: string) {
  // Authenticated IDs must come from a verified session, never from form data.
  const identity = userId ? `user:${userId}` : ingressIdentity(await headers());
  return checkRateLimit(scope, identity);
}
