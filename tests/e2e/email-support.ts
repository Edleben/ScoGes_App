import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";
import { z } from "zod";
import { test as base } from "./fixtures";
import type { Locale } from "@/types/foundation";

const userSchema = z
  .object({ id: z.string().uuid(), confirmed: z.boolean() })
  .nullable();
const searchSchema = z.object({
  messages: z.array(
    z.object({
      ID: z.string(),
      To: z.array(z.object({ Address: z.string() })),
    }),
  ),
});
const messageSchema = z.object({
  Text: z.string().optional(),
  HTML: z.string().optional(),
});

function fixtureOperation(input: Record<string, string>): unknown {
  try {
    return JSON.parse(
      execFileSync(process.execPath, ["scripts/ci/email-fixtures.mjs"], {
        input: JSON.stringify(input),
        encoding: "utf8",
        windowsHide: true,
        timeout: 15000,
        stdio: ["pipe", "pipe", "pipe"],
      }),
    );
  } catch {
    throw new Error("Isolated email fixture operation failed.");
  }
}

function loopback(value: string | undefined) {
  const url = new URL(value ?? "");
  if (
    url.protocol !== "http:" ||
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
  )
    throw new Error("Email browser fixtures require loopback services.");
  return url;
}

export async function openEmailLink(page: Page, link: string) {
  try {
    await page.goto(link);
  } catch {
    throw new Error("Email link navigation failed; sensitive URL omitted.");
  }
}

export class EmailFixtures {
  readonly app = loopback(process.env.NEXT_PUBLIC_APP_URL);
  readonly auth = loopback(process.env.NEXT_PUBLIC_SUPABASE_URL);
  readonly authMailbox = loopback(process.env.AUTH_MAILBOX_URL);
  readonly smtpMailbox = loopback(process.env.SMTP_MAILBOX_URL);
  readonly admin = createClient(
    this.auth.toString(),
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  readonly users = new Map<string, { id?: string; password: string }>();
  readonly tenants: { id: string; ownerEmail: string; ownerId: string }[] = [];

  constructor() {
    if (
      process.env.CI_ENFORCE_INTEGRATION !== "1" ||
      process.env.DATABASE_TEST_LOCAL !== "1"
    )
      throw new Error("Email browser fixtures require isolated CI.");
    fixtureOperation({
      operation: "guard",
      email: `edxstore-mail-${randomUUID()}@example.invalid`,
    });
  }
  pending() {
    const user = {
      email: `edxstore-mail-${randomUUID()}@example.invalid`,
      password: process.env.CI_TEST_PASSWORD!,
    };
    this.users.set(user.email, { password: user.password });
    return user;
  }
  user(email: string) {
    if (!this.users.has(email)) throw new Error("Unowned email fixture.");
    const result = userSchema.safeParse(
      fixtureOperation({ operation: "find-user", email }),
    );
    if (!result.success) throw new Error("Unexpected fixture response.");
    if (result.data) this.users.get(email)!.id = result.data.id;
    return result.data;
  }
  async account() {
    const user = this.pending();
    const result = await this.admin.auth.admin.createUser({
      ...user,
      email_confirm: true,
    });
    if (result.error || !result.data.user)
      throw new Error("Isolated mail account setup failed.");
    this.users.get(user.email)!.id = result.data.user.id;
    return { ...user, id: result.data.user.id };
  }
  client() {
    return createClient(
      this.auth.toString(),
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  async owner() {
    const owner = await this.account(),
      client = this.client();
    if ((await client.auth.signInWithPassword(owner)).error)
      throw new Error("Email owner authentication failed.");
    const result = await client.rpc("create_tenant_with_admin", {
      tenant_name: "E2E mail institution",
      tenant_slug: `e2e-mail-${randomUUID()}`,
      tenant_country: "TG",
      tenant_base_currency: "XOF",
      tenant_timezone: "Africa/Lome",
      tenant_default_locale: "fr",
      actor_user_id: owner.id,
    });
    if (result.error || typeof result.data !== "string")
      throw new Error("Email tenant fixture failed.");
    this.tenants.push({
      id: result.data,
      ownerEmail: owner.email,
      ownerId: owner.id,
    });
    return { ...owner, tenantId: result.data };
  }
  async signIn(
    page: Page,
    user: { email: string; password: string },
    locale: Locale,
  ) {
    await page.goto(`/login?locale=${locale}`);
    await page
      .getByLabel(locale === "fr" ? "Adresse e-mail" : "Email address")
      .fill(user.email);
    await page
      .getByLabel(locale === "fr" ? "Mot de passe" : "Password", {
        exact: true,
      })
      .fill(user.password);
    await page
      .getByRole("button", {
        name: locale === "fr" ? "Se connecter" : "Sign in",
        exact: true,
      })
      .click();
  }
  async messages(mailbox: URL, email: string) {
    const url = new URL("/api/v1/search", mailbox);
    url.searchParams.set("query", `to:${email}`);
    url.searchParams.set("limit", "10");
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const result = searchSchema.safeParse(await response.json());
    if (!response.ok || !result.success)
      throw new Error("Mail catcher search failed.");
    return result.data.messages.filter((message) =>
      message.To.some((to) => to.Address.toLowerCase() === email.toLowerCase()),
    );
  }
  async received(email: string, kind: "signup" | "recovery" | "invitation") {
    const mailbox = kind === "invitation" ? this.smtpMailbox : this.authMailbox;
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      for (const message of await this.messages(mailbox, email)) {
        const response = await fetch(
          new URL(`/api/v1/message/${encodeURIComponent(message.ID)}`, mailbox),
          { signal: AbortSignal.timeout(5000) },
        );
        const detail = messageSchema.safeParse(await response.json());
        if (!response.ok || !detail.success)
          throw new Error("Mail catcher read failed.");
        for (const match of `${detail.data.Text ?? ""}\n${detail.data.HTML ?? ""}`.matchAll(
          /https?:\/\/[^\s<>"']+/g,
        )) {
          let link: URL;
          try {
            link = new URL(match[0].replace(/&amp;/g, "&"));
          } catch {
            continue;
          }
          if (
            kind === "invitation" &&
            link.origin === this.app.origin &&
            link.pathname === "/invitations/accept" &&
            link.hash.startsWith("#token=")
          )
            return link.toString();
          if (
            kind !== "invitation" &&
            link.origin === this.auth.origin &&
            link.pathname === "/auth/v1/verify" &&
            link.searchParams.get("type") === kind
          ) {
            const callback = new URL(
              link.searchParams.get("redirect_to") ?? "",
            );
            if (
              callback.origin !== this.app.origin ||
              callback.pathname !== "/auth/callback"
            )
              throw new Error("Unexpected confirmation callback.");
            return link.toString();
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error("Expected email/link was not received; payload omitted.");
  }
  expireAuth(email: string, kind: "signup" | "recovery") {
    const user = this.user(email);
    if (!user) throw new Error("Email fixture missing.");
    fixtureOperation({
      operation: "expire-auth",
      email,
      userId: user.id,
      kind,
    });
  }
  async invitation(tenantId: string, email: string) {
    const result = await this.admin
      .from("invitations")
      .select("id,status,delivery_status")
      .eq("tenant_id", tenantId)
      .eq("email", email)
      .single<{ id: string; status: string; delivery_status: string }>();
    if (result.error) throw new Error("Invitation fixture lookup failed.");
    return result.data;
  }
  expireInvitation(
    owner: { id: string; email: string; tenantId: string },
    recipientEmail: string,
    invitationId: string,
  ) {
    fixtureOperation({
      operation: "expire-invitation",
      email: owner.email,
      userId: owner.id,
      tenantId: owner.tenantId,
      recipientEmail,
      invitationId,
    });
  }
  async cleanup() {
    for (const email of this.users.keys()) this.user(email);
    for (const [email, user] of this.users) {
      if (!user.id) continue;
      const discovered = z
        .array(z.string().uuid())
        .safeParse(
          fixtureOperation({ operation: "tenant-ids", email, userId: user.id }),
        );
      if (!discovered.success)
        throw new Error("Tenant cleanup discovery failed.");
      for (const id of discovered.data)
        if (!this.tenants.some((tenant) => tenant.id === id))
          this.tenants.push({ id, ownerEmail: email, ownerId: user.id });
    }
    for (const tenant of this.tenants)
      fixtureOperation({
        operation: "cleanup-tenant",
        email: tenant.ownerEmail,
        userId: tenant.ownerId,
        tenantId: tenant.id,
      });
    for (const [email, user] of this.users) {
      if (!user.id) continue;
      const existing = await this.admin.auth.admin.getUserById(user.id);
      if (existing.error || existing.data.user?.email !== email)
        throw new Error("Cleanup identity mismatch.");
      if ((await this.admin.auth.admin.deleteUser(user.id)).error)
        throw new Error("Mail fixture cleanup failed.");
    }
  }
}

export const test = base.extend<{ mail: EmailFixtures }>({
  mail: async ({ page }, provideFixture) => {
    const fixture = new EmailFixtures();
    // Dependency keeps browser exception monitoring active until fixture cleanup.
    void page;
    try {
      await provideFixture(fixture);
    } finally {
      await fixture.cleanup();
    }
  },
});
export { expect } from "./fixtures";
