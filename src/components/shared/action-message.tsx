"use client";

export function ActionMessage({ ok, message }: { ok?: boolean; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={ok ? "rounded-md bg-emerald-50 p-3 text-sm text-emerald-800" : "rounded-md bg-red-50 p-3 text-sm text-red-800"}
      role="status"
    >
      {message}
    </p>
  );
}
