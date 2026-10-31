import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { loopbackUrl } from "./environment.mjs";

export function assertEmailFixtureEnvironment(env) {
  if (env.CI_ENFORCE_INTEGRATION !== "1" || env.DATABASE_TEST_LOCAL !== "1")
    throw new Error("Email mutation fixtures require isolated CI services.");
  loopbackUrl(env.DATABASE_URL, ["postgres:", "postgresql:"]);
  for (const key of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_APP_URL",
    "AUTH_MAILBOX_URL",
    "SMTP_MAILBOX_URL",
  ])
    loopbackUrl(env[key]);
  if (
    !["127.0.0.1", "localhost", "::1"].includes(env.SMTP_HOST) ||
    !/^\d+$/.test(env.SMTP_PORT ?? "") ||
    Number(env.SMTP_PORT) < 1 ||
    Number(env.SMTP_PORT) > 65535
  )
    throw new Error("Email fixtures require local SMTP.");
}

async function main() {
  assertEmailFixtureEnvironment(process.env);
  const input = JSON.parse(readFileSync(0, "utf8"));
  if (!/^edxstore-mail-[a-f0-9-]+@example\.invalid$/.test(input.email ?? ""))
    throw new Error("Unexpected email fixture identity.");
  if (input.operation === "guard") {
    console.log(JSON.stringify({ ok: true }));
    return;
  }
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
    connectionTimeoutMillis: 10000,
    statement_timeout: 10000,
  });
  try {
    await client.connect();
    const found = await client.query(
      "select id,email_confirmed_at from auth.users where email=$1",
      [input.email],
    );
    if (input.operation === "find-user") {
      console.log(
        JSON.stringify(
          found.rowCount
            ? {
                id: found.rows[0].id,
                confirmed: Boolean(found.rows[0].email_confirmed_at),
              }
            : null,
        ),
      );
      return;
    }
    if (found.rowCount !== 1 || found.rows[0].id !== input.userId)
      throw new Error("Fixture ownership mismatch.");
    if (input.operation === "tenant-ids") {
      const owned = await client.query(
        "select id from public.tenants where created_by=$1 and slug like 'e2e-mail-%'",
        [input.userId],
      );
      console.log(JSON.stringify(owned.rows.map((row) => row.id)));
      return;
    }
    await client.query("begin");
    if (
      input.operation === "expire-auth" &&
      ["signup", "recovery"].includes(input.kind)
    ) {
      const column =
        input.kind === "signup" ? "confirmation_sent_at" : "recovery_sent_at";
      await client.query(
        `update auth.users set ${column}=now()-interval '2 days' where id=$1 and email=$2`,
        [input.userId, input.email],
      );
      const columns = await client.query(
        "select column_name from information_schema.columns where table_schema='auth' and table_name='one_time_tokens'",
      );
      if (columns.rowCount) {
        const expiry = columns.rows.some(
          (row) => row.column_name === "expires_at",
        )
          ? ",expires_at=now()-interval '1 minute'"
          : "";
        await client.query(
          `update auth.one_time_tokens set created_at=now()-interval '2 days'${expiry} where user_id=$1 and token_type=$2`,
          [
            input.userId,
            input.kind === "signup" ? "confirmation_token" : "recovery_token",
          ],
        );
      }
    } else if (input.operation === "expire-invitation") {
      const updated = await client.query(
        "update public.invitations i set expires_at=now()-interval '1 minute' where i.id=$1 and i.tenant_id=$2 and i.email=$3 and exists(select 1 from public.tenants t where t.id=i.tenant_id and t.created_by=$4 and t.slug like 'e2e-mail-%')",
        [
          input.invitationId,
          input.tenantId,
          input.recipientEmail,
          input.userId,
        ],
      );
      if (updated.rowCount !== 1)
        throw new Error("Invitation fixture ownership mismatch.");
    } else if (input.operation === "cleanup-tenant") {
      const owned = await client.query(
        "select id from public.tenants where id=$1 and created_by=$2 and slug like 'e2e-mail-%'",
        [input.tenantId, input.userId],
      );
      if (owned.rowCount !== 1)
        throw new Error("Tenant fixture ownership mismatch.");
      await client.query("delete from public.audit_events where tenant_id=$1", [
        input.tenantId,
      ]);
      await client.query("delete from public.tenants where id=$1", [
        input.tenantId,
      ]);
    } else throw new Error("Unknown email fixture operation.");
    await client.query("commit");
    console.log(JSON.stringify({ ok: true }));
  } finally {
    await client.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch(() => {
    console.error("Isolated email fixture operation failed.");
    process.exitCode = 1;
  });
