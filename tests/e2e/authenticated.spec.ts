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
    // Recover UI-created tenants even if an assertion failed before registration.
    for (const userId of users) {
      const discovered = await admin()
        .from("tenants")
        .select("id")
        .eq("created_by", userId)
        .like("slug", "e2e-%");
      if (discovered.error) throw new Error("UI fixture discovery failed.");
      for (const tenant of discovered.data ?? [])
        if (!tenants.includes(tenant.id)) tenants.push(tenant.id);
    }
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
      .getByRole("button", { name: "Déconnexion", exact: true })
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

  test("administration updates roles, settings and tenant-scoped access with audit history", async ({
    page,
    browser,
  }) => {
    // Hosted fixture setup includes multiple real network round trips; CI retains its tighter budget.
    test.setTimeout(env.CI_ENFORCE_INTEGRATION === "1" ? 30_000 : 60_000);
    const owner = await account(),
      member = await account();
    const target = await tenant(owner, "E2E managed institution");
    const issued = await owner.client.rpc("issue_tenant_invitation", {
      target_tenant_id: target,
      invitee_email: member.email,
      role_key: "cashier",
    });
    if (issued.error || !issued.data?.token)
      throw new Error("Administration invitation setup failed.");
    const accepted = await member.client.rpc("accept_tenant_invitation", {
      invitation_token: issued.data.token,
    });
    if (accepted.error)
      throw new Error("Administration membership setup failed.");
    await tenant(member, "E2E retained institution");
    async function login(
      p: typeof page,
      account: { email: string; password: string },
    ) {
      await p.goto("/login");
      await p.getByLabel("Adresse e-mail").fill(account.email);
      await p
        .getByLabel("Mot de passe", { exact: true })
        .fill(account.password);
      await p
        .getByRole("button", { name: "Se connecter", exact: true })
        .click();
      await expect(p).toHaveURL(/\/dashboard$/);
    }
    await login(page, owner);
    const memberContext = await browser.newContext({
      baseURL: env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
    });
    try {
      const memberPage = await memberContext.newPage();
      await login(memberPage, member);
      await memberPage.goto("/dashboard/users");
      await expect(
        memberPage.getByRole("alert").filter({ hasText: "permission" }),
      ).toContainText("permission");
      await memberPage.goto("/dashboard/settings");
      await expect(
        memberPage.getByRole("button", { name: "Enregistrer les paramètres" }),
      ).toHaveCount(0);
      await page.goto("/dashboard/users");
      const row = page.getByRole("row").filter({ hasText: member.email });
      const roles = row.locator("form").filter({
        has: page.getByRole("button", { name: "Enregistrer les rôles" }),
      });
      await roles.getByLabel("Caissier", { exact: true }).uncheck();
      await roles.getByLabel("Responsable finance", { exact: true }).check();
      await roles.getByLabel("Je confirme cette modification d’accès.").check();
      await roles
        .getByRole("button", { name: "Enregistrer les rôles" })
        .click();
      await expect(
        row.getByRole("checkbox", { name: "Responsable finance", exact: true }),
      ).toBeChecked();
      await expect(roles.getByRole("status")).toContainText(
        "Modification enregistrée",
      );
      await memberPage.goto("/dashboard/users");
      await expect(
        memberPage.getByRole("heading", { name: "Administration des membres" }),
      ).toBeVisible();
      await expect(
        memberPage.getByRole("button", { name: "Enregistrer les rôles" }),
      ).toHaveCount(0);
      const deactivate = row.locator("form").filter({
        has: page.getByRole("button", { name: "Désactiver", exact: true }),
      });
      await deactivate.getByRole("checkbox").check();
      await deactivate
        .getByRole("button", { name: "Désactiver", exact: true })
        .click();
      await expect(
        row.getByRole("cell", { name: "Inactif", exact: true }),
      ).toBeVisible();
      await memberPage.goto("/dashboard");
      await expect(
        memberPage.getByText("E2E retained institution", { exact: true }),
      ).toBeVisible();
      const revoke = row.locator("form").filter({
        has: page.getByRole("button", { name: "Révoquer", exact: true }),
      });
      await revoke.getByRole("checkbox").check();
      await revoke
        .getByRole("button", { name: "Révoquer", exact: true })
        .click();
      await expect(
        row.getByRole("cell", { name: "Révoqué", exact: true }),
      ).toBeVisible();
      const access = await member.client.rpc("current_user_has_permission", {
        target_tenant_id: target,
        permission_key: "tenant.settings.read",
      });
      expect(access.error).toBeNull();
      expect(access.data).toBe(false);
      await page.goto("/dashboard/settings");
      await page.getByLabel("Pays ISO-2").fill("US");
      await page.getByLabel("Devise ISO-3").fill("USD");
      await page.getByLabel("Fuseau horaire").fill("UTC");
      await page.getByLabel("Langue par défaut").selectOption("en");
      await page
        .getByRole("button", { name: "Enregistrer les paramètres" })
        .click();
      await expect(page.getByRole("status")).toContainText(
        "Modification enregistrée",
      );
      await page.reload();
      await expect(page.getByLabel("Devise ISO-3")).toHaveValue("USD");
      const audit = await owner.client
        .from("audit_events")
        .select("action,actor_user_id,request_id")
        .eq("tenant_id", target)
        .in("action", [
          "member.role_changed",
          "member.deactivated",
          "member.revoked",
          "tenant.settings.updated",
        ]);
      expect(audit.error).toBeNull();
      expect(audit.data).toHaveLength(4);
      expect(
        audit.data?.every(
          (event) => event.actor_user_id === owner.id && event.request_id,
        ),
      ).toBe(true);
    } finally {
      await memberContext.close();
    }
  });
  test("the last active administrator cannot remove their own role or membership", async ({
    page,
  }) => {
    const owner = await account();
    await tenant(owner, "E2E protected administrator");
    await page.goto("/login");
    await page.getByLabel("Adresse e-mail").fill(owner.email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(owner.password);
    await page
      .getByRole("button", { name: "Se connecter", exact: true })
      .click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/dashboard/users");
    const row = page.getByRole("row").filter({ hasText: owner.email });
    const roles = row.locator("form").filter({
      has: page.getByRole("button", { name: "Enregistrer les rôles" }),
    });
    await roles.getByLabel("Administrateur", { exact: true }).uncheck();
    await roles.getByLabel("Caissier", { exact: true }).check();
    await roles.getByLabel("Je confirme cette modification d’accès.").check();
    await roles.getByRole("button", { name: "Enregistrer les rôles" }).click();
    await expect(roles.getByRole("status")).toContainText(
      "au moins un administrateur actif",
    );
    const deactivate = row.locator("form").filter({
      has: page.getByRole("button", { name: "Désactiver", exact: true }),
    });
    await deactivate.getByRole("checkbox").check();
    await deactivate
      .getByRole("button", { name: "Désactiver", exact: true })
      .click();
    await expect(deactivate.getByRole("status")).toContainText(
      "au moins un administrateur actif",
    );
    await page.reload();
    await expect(
      row.getByRole("checkbox", { name: "Administrateur", exact: true }),
    ).toBeChecked();
  });

  for (const locale of ["fr", "en"] as const) {
    test(`authenticated ${locale} onboarding rejects invalid/duplicate data and creates an audited administrator`, async ({
      page,
    }) => {
      test.setTimeout(60_000);
      const owner = await account(),
        reservedOwner = await account();
      const existing = await tenant(reservedOwner, "E2E reserved institution");
      const reserved = await admin()
        .from("tenants")
        .select("slug")
        .eq("id", existing)
        .single();
      if (reserved.error) throw new Error("Reserved slug setup failed.");
      await page.goto(`/login?locale=${locale}`);
      await page
        .getByLabel(locale === "fr" ? "Adresse e-mail" : "Email address")
        .fill(owner.email);
      await page
        .getByLabel(locale === "fr" ? "Mot de passe" : "Password", {
          exact: true,
        })
        .fill(owner.password);
      await page
        .getByRole("button", {
          name: locale === "fr" ? "Se connecter" : "Sign in",
          exact: true,
        })
        .click();
      await expect(page).toHaveURL(
        new RegExp(`/onboarding${locale === "en" ? "\\?locale=en" : ""}$`),
      );
      await page
        .getByLabel(
          locale === "fr" ? "Nom de l'institution" : "Institution name",
        )
        .fill("X");
      await page.getByLabel("Slug", { exact: true }).fill(reserved.data.slug);
      await page
        .getByRole("button", {
          name: locale === "fr" ? "Créer l'institution" : "Create institution",
          exact: true,
        })
        .click();
      await expect(page.getByRole("status")).toContainText(
        locale === "fr"
          ? "Vérifiez les informations"
          : "Check the institution details",
      );
      await page
        .getByLabel(
          locale === "fr" ? "Nom de l'institution" : "Institution name",
        )
        .fill("E2E browser institution");
      await page.getByLabel("Slug", { exact: true }).fill(reserved.data.slug);
      await page
        .getByRole("button", {
          name: locale === "fr" ? "Créer l'institution" : "Create institution",
          exact: true,
        })
        .click();
      await expect(page.getByRole("status")).toContainText(
        locale === "fr"
          ? "Ce slug est déjà utilisé"
          : "This slug is already used",
      );
      const before = await owner.client
        .from("memberships")
        .select("id")
        .eq("user_id", owner.id);
      expect(before.error).toBeNull();
      expect(before.data).toHaveLength(0);
      const slug = `e2e-${randomUUID()}`;
      await page
        .getByLabel(
          locale === "fr" ? "Nom de l'institution" : "Institution name",
        )
        .fill("E2E browser institution");
      await page.getByLabel("Slug", { exact: true }).fill(slug);
      await page
        .getByRole("button", {
          name: locale === "fr" ? "Créer l'institution" : "Create institution",
          exact: true,
        })
        .click();
      await expect(page).toHaveURL(
        new RegExp(`/dashboard${locale === "en" ? "\\?locale=en" : ""}$`),
      );
      await expect(
        page.getByText("E2E browser institution", { exact: true }),
      ).toBeVisible();
      const created = await admin()
        .from("tenants")
        .select("id")
        .eq("slug", slug)
        .eq("created_by", owner.id)
        .single();
      if (created.error) throw new Error("Browser-created tenant missing.");
      tenants.push(created.data.id);
      const permission = await owner.client.rpc("current_user_has_permission", {
        target_tenant_id: created.data.id,
        permission_key: "users.manage_roles",
      });
      expect(permission.error).toBeNull();
      expect(permission.data).toBe(true);
      const settings = await owner.client
        .from("tenant_settings")
        .select("country,base_currency,timezone,default_locale")
        .eq("tenant_id", created.data.id)
        .single();
      expect(settings.error).toBeNull();
      expect(settings.data).toMatchObject({
        country: "TG",
        base_currency: "XOF",
        timezone: "Africa/Lome",
        default_locale: "fr",
      });
      const audit = await owner.client
        .from("audit_events")
        .select("actor_user_id")
        .eq("tenant_id", created.data.id)
        .eq("action", "tenant.created");
      expect(audit.error).toBeNull();
      expect(audit.data).toEqual([{ actor_user_id: owner.id }]);
    });
  }
  test("French and English administration pages render real data and localized validation", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const owner = await account();
    await tenant(owner, "E2E bilingual institution");
    await page.goto("/login");
    await page.getByLabel("Adresse e-mail").fill(owner.email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(owner.password);
    await page
      .getByRole("button", { name: "Se connecter", exact: true })
      .click();
    await expect(page).toHaveURL(/\/dashboard$/);
    for (const locale of ["fr", "en"] as const) {
      await page.goto(`/dashboard/users?locale=${locale}`);
      await expect(
        page.getByRole("heading", {
          name:
            locale === "fr"
              ? "Administration des membres"
              : "Member administration",
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("row").filter({ hasText: owner.email }),
      ).toContainText(locale === "fr" ? "Actif" : "Active");
      await expect(
        page.getByRole("checkbox", {
          name: locale === "fr" ? "Administrateur" : "Administrator",
          exact: true,
        }),
      ).toBeChecked();
      await page.goto(`/dashboard/settings?locale=${locale}`);
      await expect(
        page.getByRole("heading", {
          name:
            locale === "fr"
              ? "Paramètres de l’institution"
              : "Institution settings",
        }),
      ).toBeVisible();
      const country = page.getByLabel(
        locale === "fr" ? "Pays ISO-2" : "ISO-2 country",
      );
      await expect(country).toHaveValue("TG");
      await page
        .getByLabel(locale === "fr" ? "Fuseau horaire" : "Time zone")
        .fill("Invalid/Zone");
      await page
        .getByRole("button", {
          name:
            locale === "fr" ? "Enregistrer les paramètres" : "Save settings",
        })
        .click();
      await expect(page.getByRole("status")).toContainText(
        locale === "fr" ? "Vérifiez les champs" : "Check the fields",
      );
    }
    await page.goto("/dashboard/project");
    const checkpoint = page.getByRole("region", {
      name: "État de validation — Sprint 0",
    });
    await expect(
      checkpoint.getByText("5 jalons livrés sur 6", { exact: true }),
    ).toBeVisible();
    await expect(checkpoint.getByRole("listitem")).toHaveCount(1);
    await expect(
      checkpoint.getByRole("link", { name: "Validation des parcours (PR #3)" }),
    ).toHaveAttribute("href", "https://github.com/Edleben/ScoGes_App/pull/3");
    await expect(checkpoint).toContainText("Checklist manuelle");
    await page.goto("/dashboard/users?page=9999");
    await expect(
      page.getByRole("cell", { name: "Aucun membre à afficher.", exact: true }),
    ).toBeVisible();
  });
  test("foundation language switches and navigation preserve the document and access boundaries", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const owner = await account();
    const target = await tenant(owner, "E2E locale institution");
    await page.goto("/dashboard?locale=en");
    await expect(page).toHaveURL(/\/login\?locale=en$/);
    await page.getByLabel("Email address").fill(owner.email);
    await page.getByLabel("Password", { exact: true }).fill(owner.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard\?locale=en$/);
    for (const locale of ["fr", "en"] as const) {
      await page
        .getByRole("link", {
          name: locale === "fr" ? "Français" : "English",
          exact: true,
        })
        .click();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(
        page.getByRole("heading", {
          name:
            locale === "fr" ? "Tableau de bord Sprint 0" : "Sprint 0 dashboard",
          exact: true,
        }),
      ).toBeVisible();
      const nav = page.getByRole("navigation", {
        name: locale === "fr" ? "Navigation principale" : "Main navigation",
      });
      await nav
        .getByRole("link", {
          name: locale === "fr" ? "Tracker projet" : "Project tracker",
        })
        .click();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(
        page.getByRole("heading", {
          name:
            locale === "fr"
              ? "Tracker des sprints et fonctionnalités"
              : "Sprint and feature tracker",
        }),
      ).toBeVisible();
      await expect(page.getByRole("progressbar").first()).toHaveAttribute(
        "aria-label",
        new RegExp(locale === "fr" ? "Progression" : "Progress"),
      );
      await expect(
        page.getByRole("region", {
          name:
            locale === "fr"
              ? "État de validation — Sprint 0"
              : "Validation status — Sprint 0",
        }),
      ).toContainText(locale === "fr" ? "reste ouverte" : "remains open");
      for (const [fr, en, title] of [
        [
          "Paramètres",
          "Settings",
          locale === "fr"
            ? "Paramètres de l’institution"
            : "Institution settings",
        ],
        [
          "Utilisateurs",
          "Users",
          locale === "fr"
            ? "Administration des membres"
            : "Member administration",
        ],
      ] as const) {
        await nav
          .getByRole("link", { name: locale === "fr" ? fr : en, exact: true })
          .click();
        await expect(
          page.getByRole("heading", { name: title, exact: true }),
        ).toBeVisible();
        if (locale === "en") await expect(page).toHaveURL(/locale=en/);
      }
      await nav
        .getByRole("link", {
          name: locale === "fr" ? "Tableau de bord" : "Dashboard",
          exact: true,
        })
        .click();
      await expect(
        page.getByRole("heading", {
          name:
            locale === "fr" ? "Tableau de bord Sprint 0" : "Sprint 0 dashboard",
          exact: true,
        }),
      ).toBeVisible();
    }
    // The live membership remains authoritative after locale navigation.
    const member = await owner.client
      .from("memberships")
      .select("id,updated_at")
      .eq("tenant_id", target)
      .single();
    expect(member.error).toBeNull();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/\/login\?locale=en$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.goto("/dashboard/settings?locale=en");
    await expect(page).toHaveURL(/\/login\?locale=en$/);
    await page.goto("/missing-foundation-page?locale=en");
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
  test("stale settings forms cannot overwrite a more recent committed change", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const owner = await account();
    const target = await tenant(owner, "E2E stale settings institution");
    await page.goto("/login");
    await page.getByLabel("Adresse e-mail").fill(owner.email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(owner.password);
    await page
      .getByRole("button", { name: "Se connecter", exact: true })
      .click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/dashboard/settings?locale=en");
    const snapshot = await owner.client
      .from("tenant_settings")
      .select("updated_at")
      .eq("tenant_id", target)
      .single();
    if (snapshot.error) throw new Error("Settings snapshot unavailable.");
    const updated = await owner.client.rpc("update_tenant_settings", {
      target_tenant_id: target,
      expected_updated_at: snapshot.data.updated_at,
      new_country: "US",
      new_base_currency: "USD",
      new_timezone: "UTC",
      new_default_locale: "en",
    });
    expect(updated.error).toBeNull();
    expect(updated.data).toBe(true);
    await page
      .getByRole("button", { name: "Save settings", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "details have changed",
    );
    await page.reload();
    await expect(page.getByLabel("ISO-2 country")).toHaveValue("US");
    await expect(page.getByLabel("ISO-3 currency")).toHaveValue("USD");
    const audit = await owner.client
      .from("audit_events")
      .select("id")
      .eq("tenant_id", target)
      .eq("action", "tenant.settings.updated");
    expect(audit.error).toBeNull();
    expect(audit.data).toHaveLength(1);
  });
});
