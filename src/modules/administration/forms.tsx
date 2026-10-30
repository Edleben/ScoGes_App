"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { SelectField } from "@/components/ui/select-field";
import { ActionMessage } from "@/components/shared/action-message";
import {
  changeMemberRolesAction,
  changeMemberStatusAction,
  updateSettingsAction,
} from "./actions";
import { adminText, type AdminState } from "./messages";
import { authText } from "@/modules/identity/auth-messages";
import type { Locale, TenantRole } from "@/types/foundation";

type Revision = { tenantId: string; updatedAt: string };
const initial: AdminState = { ok: false };
function RevisionInputs({
  tenantId,
  updatedAt,
  locale,
}: Revision & { locale: Locale }) {
  return (
    <>
      <input type="hidden" name="contextTenantId" value={tenantId} />
      <input type="hidden" name="updatedAt" value={updatedAt} />
      <input type="hidden" name="locale" value={locale} />
    </>
  );
}
function Confirmation({ locale }: { locale: Locale }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name="confirm" required />
      {adminText(locale, "confirm")}
    </label>
  );
}
export function MemberRolesForm({
  membershipId,
  roles,
  locale,
  ...revision
}: Revision & { membershipId: string; roles: TenantRole[]; locale: Locale }) {
  const [state, action, pending] = useActionState(
    changeMemberRolesAction,
    initial,
  );
  return (
    <form action={action} className="grid gap-3" lang={locale}>
      <RevisionInputs {...revision} locale={locale} />
      <input type="hidden" name="membershipId" value={membershipId} />
      <fieldset
        key={revision.updatedAt}
        disabled={pending}
        className="grid gap-2"
      >
        <legend className="mb-2 font-semibold">
          {adminText(locale, "roles")}
        </legend>
        {(
          [
            "tenant_admin",
            "finance_manager",
            "cashier",
            "registrar",
            "auditor",
          ] satisfies TenantRole[]
        ).map((role) => (
          <label key={role} className="flex items-center gap-2">
            <input
              type="checkbox"
              name="roles"
              value={role}
              defaultChecked={roles.includes(role)}
            />
            {authText(locale, role)}
          </label>
        ))}
        <Confirmation locale={locale} />
        <Button type="submit">
          {adminText(locale, pending ? "pending" : "saveRoles")}
        </Button>
      </fieldset>
      <ActionMessage {...state} />
    </form>
  );
}
export function MemberStatusForm({
  membershipId,
  status,
  locale,
  ...revision
}: Revision & {
  membershipId: string;
  status: "inactive" | "revoked";
  locale: Locale;
}) {
  const [state, action, pending] = useActionState(
    changeMemberStatusAction,
    initial,
  );
  return (
    <form action={action} className="grid gap-3" lang={locale}>
      <RevisionInputs {...revision} locale={locale} />
      <input type="hidden" name="membershipId" value={membershipId} />
      <input type="hidden" name="status" value={status} />
      <fieldset
        key={revision.updatedAt}
        disabled={pending}
        className="grid gap-2"
      >
        <Confirmation locale={locale} />
        <Button type="submit">
          {adminText(
            locale,
            pending
              ? "pending"
              : status === "inactive"
                ? "deactivate"
                : "revoke",
          )}
        </Button>
      </fieldset>
      <ActionMessage {...state} />
    </form>
  );
}
export type SettingsValues = {
  country: string;
  base_currency: string;
  timezone: string;
  default_locale: Locale;
};
export function SettingsForm({
  values,
  locale,
  ...revision
}: Revision & { values: SettingsValues; locale: Locale }) {
  const [state, action, pending] = useActionState(
    updateSettingsAction,
    initial,
  );
  return (
    <form action={action} className="grid max-w-xl gap-4" lang={locale}>
      <RevisionInputs {...revision} locale={locale} />
      <fieldset
        key={revision.updatedAt}
        disabled={pending}
        className="grid gap-4"
      >
        <FormField
          label={adminText(locale, "country")}
          name="country"
          required
          defaultValue={values.country}
          maxLength={2}
        />
        <FormField
          label={adminText(locale, "currency")}
          name="baseCurrency"
          required
          defaultValue={values.base_currency}
          maxLength={3}
        />
        <FormField
          label={adminText(locale, "timezone")}
          name="timezone"
          required
          defaultValue={values.timezone}
          maxLength={80}
        />
        <SelectField
          label={adminText(locale, "language")}
          name="defaultLocale"
          defaultValue={values.default_locale}
          options={[
            { label: "Français", value: "fr" },
            { label: "English", value: "en" },
          ]}
        />
        <Button type="submit">
          {adminText(locale, pending ? "pending" : "save")}
        </Button>
      </fieldset>
      <ActionMessage {...state} />
    </form>
  );
}
