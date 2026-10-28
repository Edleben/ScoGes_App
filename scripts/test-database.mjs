import { existsSync, readFileSync, readdirSync } from "node:fs";
import { parseEnv } from "node:util";
import pg from "pg";

const env = {
  ...(existsSync(".env.local")
    ? parseEnv(readFileSync(".env.local", "utf8"))
    : {}),
  ...process.env,
};
if (!env.DATABASE_URL)
  throw new Error("DATABASE_URL is required for database tests.");
// Explicit TLS prevents a bare DATABASE_URL from silently using plaintext.
// Remove URL SSL overrides so certificate and hostname verification stay enabled.
const connectionUrl = new URL(env.DATABASE_URL);
for (const key of [
  "sslmode",
  "sslcert",
  "sslkey",
  "sslrootcert",
  "ssl",
  "uselibpqcompat",
])
  connectionUrl.searchParams.delete(key);
const ca = readFileSync(
  env.DATABASE_SSL_ROOT_CERT || "supabase/certs/prod-ca-2021.crt",
  "utf8",
);
const client = new pg.Client({
  connectionString: connectionUrl.toString(),
  ssl: { ca, rejectUnauthorized: true },
  connectionTimeoutMillis: 15000,
  statement_timeout: 30000,
});
try {
  await client.connect();
  console.log("PostgreSQL connection: passed");
  await client.query("begin");
  const { rows } = await client.query(
    "select to_regclass('public.memberships') is not null as installed",
  );
  console.log(`Foundation schema installed: ${rows[0].installed}`);
  if (!rows[0].installed) {
    // A fresh database can be tested without installing anything permanently.
    await client.query(
      readFileSync(
        "supabase/migrations/20260917000100_sprint_0_foundation.sql",
        "utf8",
      ),
    );
  }
  if (!process.argv.includes("--baseline")) {
    const migration = readdirSync("supabase/migrations").find((name) =>
      name.endsWith("_fix_membership_self_read.sql"),
    );
    if (!migration) throw new Error("RLS migration is missing.");
    const installed = await client.query(
      "select 1 from pg_policies where schemaname='public' and tablename='memberships' and policyname='users can read own active membership'",
    );
    if (!installed.rowCount)
      await client.query(
        readFileSync(`supabase/migrations/${migration}`, "utf8"),
      );
  }
  await client.query(
    readFileSync("supabase/tests/tenant_isolation.sql", "utf8"),
  );
  if (!process.argv.includes("--baseline")) {
    const { rows } = await client.query(
      "select to_regprocedure('public.accept_tenant_invitation(text)') is not null as installed",
    );
    if (!rows[0].installed) {
      const migration = readdirSync("supabase/migrations").find((name) =>
        name.endsWith("_authentication_lifecycle.sql"),
      );
      if (!migration)
        throw new Error("Authentication lifecycle migration is missing.");
      await client.query(
        readFileSync(`supabase/migrations/${migration}`, "utf8"),
      );
    }
    await client.query(
      readFileSync("supabase/tests/authentication_lifecycle.sql", "utf8"),
    );
    console.log("Invitation lifecycle assertions: passed");
  }
  console.log("Database authorization assertions: passed");
} catch (error) {
  // Assertion messages contain only fixed test labels, never database values.
  console.error(
    error.code === "P0001"
      ? `Database test failed: ${error.message}`
      : `Database verification failed (${error.code ?? "connection/configuration"}).`,
  );
  process.exitCode = 1;
} finally {
  await client.query("rollback").catch(() => {});
  await client.end();
  console.log(
    "Test transaction rolled back; no fixtures or schema changes retained.",
  );
}
