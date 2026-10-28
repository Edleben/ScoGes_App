import { getLocale } from "@/i18n/messages";
import { authText, type AuthMessageKey } from "./auth-messages";
export type AuthActionState = { ok: boolean; message?: string };
export function formLocale(form: FormData) {
  return getLocale(String(form.get("locale") ?? "fr"));
}
export function authReply(
  form: FormData,
  ok: boolean,
  key: AuthMessageKey,
): AuthActionState {
  return { ok, message: authText(formLocale(form), key) };
}
