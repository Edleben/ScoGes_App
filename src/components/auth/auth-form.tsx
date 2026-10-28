"use client";
import { useActionState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  signInAction,
  signUpAction,
  requestPasswordResetAction,
  updatePasswordAction,
} from "@/modules/identity/actions";
import {
  acceptInvitationAction,
  captureInvitationAction,
} from "@/modules/identity/invitation-actions";
import { authText } from "@/modules/identity/auth-messages";
import type { Locale } from "@/types/foundation";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { ActionMessage } from "@/components/shared/action-message";

const actions = {
  login: signInAction,
  signup: signUpAction,
  recovery: requestPasswordResetAction,
  reset: updatePasswordAction,
  accept: acceptInvitationAction,
  capture: captureInvitationAction,
};
export type AuthFormMode = keyof typeof actions;
const subscribe = (listener: () => void) => {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
};
const fragmentToken = () =>
  new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";

export function AuthForm({
  mode,
  locale,
  next = "/dashboard",
}: {
  mode: AuthFormMode;
  locale: Locale;
  next?: string;
}) {
  const [state, action, pending] = useActionState(actions[mode], { ok: false });
  const token = useSyncExternalStore<string | null>(
    subscribe,
    fragmentToken,
    () => null,
  );
  return (
    <form action={action} className="grid gap-4" lang={locale}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next} />
      {mode === "capture" && (
        <input type="hidden" name="token" value={token ?? ""} />
      )}
      {mode === "capture" && token === "" && (
        <p role="status">{authText(locale, "invalidLink")}</p>
      )}
      {["login", "signup", "recovery"].includes(mode) && (
        <FormField
          label={authText(locale, "email")}
          name="email"
          type="email"
          required
          autoComplete="email"
          maxLength={254}
        />
      )}
      {["login", "signup", "reset"].includes(mode) && (
        <FormField
          label={authText(locale, "password")}
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      )}
      {["signup", "reset"].includes(mode) && (
        <FormField
          label={authText(locale, "confirm")}
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
        />
      )}
      <ActionMessage ok={state.ok} message={state.message} />
      <Button
        type="submit"
        disabled={pending || (mode === "capture" && !token)}
      >
        {authText(
          locale,
          pending
            ? "pending"
            : mode === "login"
              ? "loginSubmit"
              : mode === "accept"
                ? "accept"
                : mode === "capture"
                  ? "capture"
                  : "submit",
        )}
      </Button>
    </form>
  );
}

export function InvitationEntry({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const token = useSyncExternalStore<string | null>(
    subscribe,
    fragmentToken,
    () => null,
  );
  return token ? <AuthForm mode="capture" locale={locale} /> : children;
}

export function AuthLanguageLinks({
  path,
  next,
}: {
  path: string;
  next: string;
}) {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => "",
  );
  return (
    <>
      <Link
        href={
          `${path}?locale=fr&next=${encodeURIComponent(next)}${hash}` as Route
        }
        lang="fr"
      >
        Français
      </Link>
      <Link
        href={
          `${path}?locale=en&next=${encodeURIComponent(next)}${hash}` as Route
        }
        lang="en"
      >
        English
      </Link>
    </>
  );
}
