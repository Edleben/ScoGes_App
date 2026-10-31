import {
  test,
  expect,
  openEmailLink,
  type EmailFixtures,
} from "./email-support";
import type { Page } from "@playwright/test";
import type { Locale } from "@/types/foundation";
import { authText } from "@/modules/identity/auth-messages";

// Hosted receipt is separately opt-in/manual. Ordinary CI cannot send external mail.
if (process.env.CI_ENFORCE_INTEGRATION === "1") {
  test.use({ trace: "off", screenshot: "off", video: "off" });
  test.beforeEach(() => test.setTimeout(60_000));
  const at = async (page: Page, path: string) =>
    expect.poll(() => new URL(page.url()).pathname).toBe(path);
  async function signup(page: Page, mail: EmailFixtures, locale: Locale) {
    const user = mail.pending();
    await page.goto(`/signup?locale=${locale}`);
    await page.getByLabel(authText(locale, "email")).fill(user.email);
    await page
      .getByLabel(authText(locale, "password"), { exact: true })
      .fill(user.password);
    await page
      .getByLabel(authText(locale, "confirm"), { exact: true })
      .fill(user.password);
    await page
      .getByRole("button", { name: authText(locale, "submit"), exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText(
      authText(locale, "checkEmail"),
    );
    return user;
  }
  async function recovery(page: Page, email: string, locale: Locale) {
    await page.goto(`/auth/forgot-password?locale=${locale}`);
    await page.getByLabel(authText(locale, "email")).fill(email);
    await page
      .getByRole("button", { name: authText(locale, "submit"), exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText(
      authText(locale, "checkEmail"),
    );
  }
  async function rejectedLink(page: Page, link: string, locale: Locale) {
    await openEmailLink(page, link);
    await at(page, "/login");
    await expect(page.getByRole("status")).toHaveText(
      authText(locale, "invalidLink"),
    );
    await page.goto(`/auth/reset-password?locale=${locale}`);
    await expect(page.getByRole("status")).toHaveText(
      authText(locale, "invalidLink"),
    );
    await expect(page.locator('input[name="password"]')).toHaveCount(0);
    await page.goto(`/dashboard?locale=${locale}`);
    await at(page, "/login");
  }
  async function invite(page: Page, email: string, locale: Locale) {
    await page.goto(`/dashboard/users?locale=${locale}`);
    await page.getByLabel(authText(locale, "email")).fill(email);
    // A wrapped select label includes its option text; use the established partial label lookup.
    await page.getByLabel(authText(locale, "role")).selectOption("cashier");
    await page
      .getByRole("button", { name: authText(locale, "invite"), exact: true })
      .click();
  }
  async function recipient(
    page: Page,
    user: { email: string; password: string },
    link: string,
    locale: Locale,
  ) {
    await page.context().clearCookies();
    await openEmailLink(page, link);
    await page
      .getByRole("button", { name: authText(locale, "capture"), exact: true })
      .click();
    await page
      .getByRole("link", { name: authText(locale, "login"), exact: true })
      .click();
    // Keep the invitation return destination and captured cookie in this browser.
    await page.getByLabel(authText(locale, "email")).fill(user.email);
    await page
      .getByLabel(authText(locale, "password"), { exact: true })
      .fill(user.password);
    await page
      .getByRole("button", {
        name: authText(locale, "loginSubmit"),
        exact: true,
      })
      .click();
    await at(page, "/invitations/accept");
    await page
      .getByRole("button", { name: authText(locale, "accept"), exact: true })
      .click();
  }

  for (const locale of ["fr", "en"] as const) {
    test(`${locale} confirmation is received, completed and cannot be reused`, async ({
      page,
      mail,
    }) => {
      const user = await signup(page, mail, locale);
      const link = await mail.received(user.email, "signup");
      expect(mail.user(user.email)?.confirmed).toBe(false);
      await openEmailLink(page, link);
      await at(page, "/onboarding");
      expect(mail.user(user.email)?.confirmed).toBe(true);
      await page.context().clearCookies();
      await rejectedLink(page, link, locale);
    });
    test(`${locale} received confirmation expires without confirming the account`, async ({
      page,
      mail,
    }) => {
      const user = await signup(page, mail, locale),
        link = await mail.received(user.email, "signup");
      mail.expireAuth(user.email, "signup");
      await rejectedLink(page, link, locale);
      expect(mail.user(user.email)?.confirmed).toBe(false);
    });
    test(`${locale} recovery is received, updates the password and cannot be reused`, async ({
      page,
      mail,
    }) => {
      const user = await mail.account();
      await recovery(page, user.email, locale);
      const link = await mail.received(user.email, "recovery");
      await openEmailLink(page, link);
      await at(page, "/auth/reset-password");
      const password = process.env.CI_TEST_UPDATED_PASSWORD!;
      await page
        .getByLabel(authText(locale, "password"), { exact: true })
        .fill(password);
      await page
        .getByLabel(authText(locale, "confirm"), { exact: true })
        .fill(password);
      await page
        .getByRole("button", { name: authText(locale, "submit"), exact: true })
        .click();
      await at(page, "/login");
      const client = mail.client();
      expect(Boolean((await client.auth.signInWithPassword(user)).error)).toBe(
        true,
      );
      expect(
        Boolean(
          (
            await client.auth.signInWithPassword({
              email: user.email,
              password,
            })
          ).error,
        ),
      ).toBe(false);
      await client.auth.signOut();
      await page.context().clearCookies();
      await rejectedLink(page, link, locale);
    });
    test(`${locale} received recovery expires without changing the password`, async ({
      page,
      mail,
    }) => {
      const user = await mail.account();
      await recovery(page, user.email, locale);
      const link = await mail.received(user.email, "recovery");
      mail.expireAuth(user.email, "recovery");
      await rejectedLink(page, link, locale);
      const client = mail.client();
      expect(Boolean((await client.auth.signInWithPassword(user)).error)).toBe(
        false,
      );
      await client.auth.signOut();
    });
    test(`${locale} application invitation is received, accepted and cannot be reused`, async ({
      page,
      mail,
    }) => {
      const owner = await mail.owner(),
        user = await mail.account();
      await mail.signIn(page, owner, locale);
      await at(page, "/dashboard");
      await invite(page, user.email, locale);
      await expect(page.getByRole("status")).toHaveText(
        authText(locale, "delivered"),
      );
      const link = await mail.received(user.email, "invitation");
      expect(
        (await mail.invitation(owner.tenantId, user.email)).delivery_status,
      ).toBe("sent");
      await recipient(page, user, link, locale);
      await at(page, "/dashboard");
      const membership = await mail.admin
        .from("memberships")
        .select("id")
        .eq("tenant_id", owner.tenantId)
        .eq("user_id", user.id)
        .eq("status", "active");
      expect(membership.error).toBeNull();
      expect(membership.data).toHaveLength(1);
      await openEmailLink(page, link);
      await page
        .getByRole("button", { name: authText(locale, "capture"), exact: true })
        .click();
      await page
        .getByRole("button", { name: authText(locale, "accept"), exact: true })
        .click();
      await expect(page.getByRole("status")).toHaveText(
        authText(locale, "acceptanceFailed"),
      );
    });
    test(`${locale} received invitation expiry cannot create a membership`, async ({
      page,
      mail,
    }) => {
      const owner = await mail.owner(),
        user = await mail.account();
      await mail.signIn(page, owner, locale);
      await at(page, "/dashboard");
      await invite(page, user.email, locale);
      await expect(page.getByRole("status")).toHaveText(
        authText(locale, "delivered"),
      );
      const link = await mail.received(user.email, "invitation"),
        invitation = await mail.invitation(owner.tenantId, user.email);
      mail.expireInvitation(owner, user.email, invitation.id);
      await recipient(page, user, link, locale);
      await expect(page.getByRole("status")).toHaveText(
        authText(locale, "acceptanceFailed"),
      );
      const rows = await mail.admin
        .from("memberships")
        .select("id")
        .eq("tenant_id", owner.tenantId)
        .eq("user_id", user.id);
      expect(rows.error).toBeNull();
      expect(rows.data).toHaveLength(0);
    });
    test(`${locale} SMTP rejection reports failure, records its audit and delivers no email`, async ({
      page,
      mail,
    }) => {
      const owner = await mail.owner(),
        email = `edxstore-rejected-${owner.id}@rejected.invalid`;
      await mail.signIn(page, owner, locale);
      await at(page, "/dashboard");
      await invite(page, email, locale);
      await expect(page.getByRole("status")).toHaveText(
        authText(locale, "deliveryFailed"),
      );
      const invitation = await mail.invitation(owner.tenantId, email);
      expect(invitation.delivery_status).toBe("failed");
      const events = await mail.admin
        .from("audit_events")
        .select("id")
        .eq("tenant_id", owner.tenantId)
        .eq("target_id", invitation.id)
        .eq("action", "member.invitation_delivery_failed");
      expect(events.error).toBeNull();
      expect(events.data).toHaveLength(1);
      expect(await mail.messages(mail.smtpMailbox, email)).toHaveLength(0);
    });
  }
}
