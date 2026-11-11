// Classify only the fixed database backstop error, never arbitrary provider text.
export function isRpcRateLimit(
  error: { code?: string; message?: string } | null | undefined,
) {
  return error?.code === "PT429" && error.message === "rpc_rate_limited";
}
