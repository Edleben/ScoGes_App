"use client";

import { foundationText } from "@/i18n/foundation-messages";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SelectField } from "@/components/ui/select-field";
import { ActionMessage } from "@/components/shared/action-message";
import type { AuthActionState } from "@/modules/identity/actions";
import { inviteMemberAction } from "@/modules/identity/invitation-actions";
import { authText } from "@/modules/identity/auth-messages";
import type { Locale, TenantRole } from "@/types/foundation";
import {
  createTenantAction,
  type ActionState,
} from "@/modules/tenants/actions";

const initialState = { ok: false } satisfies ActionState;
const authInitialState = { ok: false } satisfies AuthActionState;

export function TenantOnboardingForm({ locale = "fr" }: { locale?: Locale }) {
  const text = (key: Parameters<typeof foundationText>[1]) =>
    foundationText(locale, key);
  const [state, formAction, pending] = useActionState(
    createTenantAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4" lang={locale}>
      <input type="hidden" name="locale" value={locale} />
      <FormField
        label={text("name")}
        name="name"
        required
        placeholder={text("nameExample")}
      />
      <FormField
        label={text("slug")}
        name="slug"
        required
        placeholder="college-lumiere"
      />
      <FormField
        label={text("country")}
        name="country"
        required
        defaultValue="TG"
      />
      <FormField
        label={text("currency")}
        name="baseCurrency"
        required
        defaultValue="XOF"
      />
      <FormField
        label={text("timezone")}
        name="timezone"
        required
        defaultValue="Africa/Lome"
      />
      <SelectField
        label={text("defaultLocale")}
        name="defaultLocale"
        defaultValue="fr"
        options={[
          { label: text("french"), value: "fr" },
          { label: text("english"), value: "en" },
        ]}
      />
      <ActionMessage ok={state.ok} message={state.message} />
      <Button disabled={pending} type="submit">
        {text(pending ? "creating" : "create")}
      </Button>
    </form>
  );
}

export function InviteMemberForm({ locale = "fr" }: { locale?: Locale }) {
  const [state, formAction, pending] = useActionState(
    inviteMemberAction,
    authInitialState,
  );

  return (
    <form
      action={formAction}
      lang={locale}
      className="grid gap-4 rounded-md border border-[var(--border)] bg-white p-5"
    >
      <input type="hidden" name="locale" value={locale} />
      <FormField
        label={authText(locale, "email")}
        name="email"
        type="email"
        required
      />
      <SelectField
        label={authText(locale, "role")}
        name="role"
        defaultValue="registrar"
        options={(
          [
            "tenant_admin",
            "finance_manager",
            "cashier",
            "registrar",
            "auditor",
          ] satisfies TenantRole[]
        ).map((role) => ({ label: authText(locale, role), value: role }))}
      />
      <ActionMessage ok={state.ok} message={state.message} />
      <Button disabled={pending} type="submit">
        {authText(locale, pending ? "pending" : "invite")}
      </Button>
    </form>
  );
}
