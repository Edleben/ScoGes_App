"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SelectField } from "@/components/ui/select-field";
import { ActionMessage } from "@/components/shared/action-message";
import { inviteMemberAction, signInAction, type AuthActionState } from "@/modules/identity/actions";
import { createTenantAction, type ActionState } from "@/modules/tenants/actions";

const initialState = { ok: false } satisfies ActionState;
const authInitialState = { ok: false } satisfies AuthActionState;

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signInAction, authInitialState);

  return (
    <form action={formAction} className="grid gap-4">
      <FormField label="Adresse e-mail" name="email" type="email" required autoComplete="email" />
      <FormField label="Mot de passe" name="password" type="password" required autoComplete="current-password" />
      <ActionMessage ok={state.ok} message={state.message} />
      <Button disabled={pending} type="submit">
        {pending ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  );
}

export function TenantOnboardingForm() {
  const [state, formAction, pending] = useActionState(createTenantAction, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <FormField label="Nom de l'institution" name="name" required placeholder="College Lumiere" />
      <FormField label="Slug" name="slug" required placeholder="college-lumiere" />
      <FormField label="Pays ISO-2" name="country" required defaultValue="TG" />
      <FormField label="Devise ISO-3" name="baseCurrency" required defaultValue="XOF" />
      <FormField label="Fuseau horaire" name="timezone" required defaultValue="Africa/Lome" />
      <SelectField
        label="Langue par defaut"
        name="defaultLocale"
        defaultValue="fr"
        options={[
          { label: "Francais", value: "fr" },
          { label: "English", value: "en" },
        ]}
      />
      <ActionMessage ok={state.ok} message={state.message} />
      <Button disabled={pending} type="submit">
        {pending ? "Creation..." : "Creer l'institution"}
      </Button>
    </form>
  );
}

export function InviteMemberForm() {
  const [state, formAction, pending] = useActionState(inviteMemberAction, authInitialState);

  return (
    <form action={formAction} className="grid gap-4 rounded-md border border-[var(--border)] bg-white p-5">
      <FormField label="Adresse e-mail" name="email" type="email" required />
      <SelectField
        label="Role"
        name="role"
        defaultValue="registrar"
        options={[
          { label: "Administrateur tenant", value: "tenant_admin" },
          { label: "Responsable finance", value: "finance_manager" },
          { label: "Caissier", value: "cashier" },
          { label: "Scolarite", value: "registrar" },
          { label: "Auditeur", value: "auditor" },
        ]}
      />
      <ActionMessage ok={state.ok} message={state.message} />
      <Button disabled={pending} type="submit">
        {pending ? "Invitation..." : "Inviter"}
      </Button>
    </form>
  );
}
