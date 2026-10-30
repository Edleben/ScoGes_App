import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { randomUUID } from "node:crypto";

const env = {
  ...(existsSync(".env.local")
    ? parseEnv(readFileSync(".env.local", "utf8"))
    : {}),
  ...process.env,
};
const secretKey = env.SUPABASE_SECRET_KEY;
const configured = Boolean(
  secretKey?.startsWith("sb_secret_") &&
  env.NEXT_PUBLIC_SUPABASE_URL &&
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
if (
  env.CI_ENFORCE_INTEGRATION === "1" &&
  (!configured || !env.CI_TEST_PASSWORD || !env.CI_TEST_UPDATED_PASSWORD)
) {
  throw new Error(
    "CI requires configured isolated authentication fixtures; skipping is forbidden.",
  );
}
test.use({ trace: "off", screenshot: "off", video: "off" });
test.describe("live authentication lifecycle", () => {
  test.skip(
    !configured,
    "Requires the configured project's server-only SUPABASE_SECRET_KEY for isolated test-account setup/cleanup.",
  );
  const users: string[] = [],
    tenants: string[] = [];
  const admin = () =>
    createClient(env.NEXT_PUBLIC_SUPABASE_URL!, secretKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  async function account() {
    const email = `edxstore-e2e-${randomUUID()}@example.invalid`,
      password = env.CI_TEST_PASSWORD || randomUUID() + "Aa1!";
    const { data, error } = await admin().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user)
      throw new Error("Test-account setup failed; check the server-only key.");
    users.push(data.user.id);
    const client = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    if ((await client.auth.signInWithPassword({ email, password })).error)
      throw new Error("Test-account authentication failed.");
    return { email, password, id: data.user.id, client };
  }
  async function tenant(
    owner: Awaited<ReturnType<typeof account>>,
    name: string,
  ) {
    const { data, error } = await owner.client.rpc("create_tenant_with_admin", {
      tenant_name: name,
      tenant_slug: `e2e-${randomUUID()}`,
      tenant_country: "TG",
      tenant_base_currency: "XOF",
      tenant_timezone: "Africa/Lome",
      tenant_default_locale: "fr",
      actor_user_id: owner.id,
    });
    if (error || typeof data !== "string")
      throw new Error("Test tenant setup failed.");
    tenants.push(data);
    return data;
  }
  test.afterEach(async () => {
    // Cleanup is restricted to exact IDs created by this test; no real tenant data.
    for (const id of tenants.splice(0)) {
      const audit = await admin()
        .from("audit_events")
        .delete()
        .eq("tenant_id", id);
      const tenant = await admin().from("tenants").delete().eq("id", id);
      if (audit.error || tenant.error)
        throw new Error("Test tenant cleanup failed.");
    }
    for (const id of users.splice(0))
      if ((await admin().auth.admin.deleteUser(id)).error)
        throw new Error("Test account cleanup failed.");
  });
  test("sign in, protected dashboard, sign out and access denial", async ({
    page,
  }) => {
    const owner = await account();
    await tenant(owner, "E2E auth institution");
    await page.goto("/login");
    await page.getByLabel("Adresse e-mail").fill(owner.email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(owner.password);
    await page
      .getByRole("button", { name: "Se connecter", exact: true })
      .click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByText("E2E auth institution", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Deconnexion", exact: true })
      .click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });
  test("invitation acceptance selects the invited tenant and cannot be replayed", async ({
    page,
  }) => {
    const owner = await account(),
      recipient = await account();
    const target = await tenant(owner, "E2E invited institution");
    await tenant(recipient, "E2E original institution");
    const { data, error } = await owner.client.rpc("issue_tenant_invitation", {
      target_tenant_id: target,
      invitee_email: recipient.email,
      role_key: "cashier",
    });
    if (error || !data?.token)
      throw new Error("Test invitation issuance failed.");
    const url = `/invitations/accept#token=${data.token}`;
    await page.goto(url);
    await page.getByRole("button", { name: "Ouvrir l’invitation" }).click();
    await page.getByRole("link", { name: "Connexion", exact: true }).click();
    await page.getByLabel("Adresse e-mail").fill(recipient.email);
    await page
      .getByLabel("Mot de passe", { exact: true })
      .fill(recipient.password);
    await page
      .getByRole("button", { name: "Se connecter", exact: true })
      .click();
    await expect(page).toHaveURL(/\/invitations\/accept$/);
    await page.getByRole("button", { name: "Accepter l’invitation" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByText("E2E invited institution", { exact: true }),
    ).toBeVisible();
    const permission = await recipient.client.rpc(
      "current_user_has_permission",
      { target_tenant_id: target, permission_key: "users.invite" },
    );
    expect(permission.error).toBeNull();
    expect(permission.data).toBe(false);
    await page.goto(url);
    await page.getByRole("button", { name: "Ouvrir l’invitation" }).click();
    await page.getByRole("button", { name: "Accepter l’invitation" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Impossible d’accepter",
    );
  });
  test("password update signs out and invalidates the old password", async ({
    page,
  }) => {
    const owner = await account();
    await page.goto("/login");
    await page.getByLabel("Adresse e-mail").fill(owner.email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(owner.password);
    await page
      .getByRole("button", { name: "Se connecter", exact: true })
      .click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await page.goto("/auth/reset-password?locale=en");
    const password = env.CI_TEST_UPDATED_PASSWORD || randomUUID() + "Bb2!";
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password").fill(password);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page).toHaveURL(/\/login\?notice=passwordUpdated&locale=en$/);
    expect(
      (
        await owner.client.auth.signInWithPassword({
          email: owner.email,
          password: owner.password,
        })
      ).error,
    ).not.toBeNull();
    expect(
      (
        await owner.client.auth.signInWithPassword({
          email: owner.email,
          password,
        })
      ).error,
    ).toBeNull();
  });
});
