import { existsSync, readFileSync, readdirSync } from "node:fs";
import { parseEnv } from "node:util";
import pg from "pg";
import { databaseTestOptions } from "./ci/environment.mjs";

const env = {
  ...(existsSync(".env.local")
    ? parseEnv(readFileSync(".env.local", "utf8"))
    : {}),
  ...process.env,
};
if (!env.DATABASE_URL)
  throw new Error("DATABASE_URL is required for database tests.");
// TLS stays mandatory for hosted databases. Only explicitly opted-in loopback
// Docker fixtures can use the local database's unencrypted socket.
const client = new pg.Client(databaseTestOptions(env));
function requireAppliedSchema(installed) {
  if (env.CI_ENFORCE_INTEGRATION === "1" && !installed) {
    throw Object.assign(
      new Error("CI requires migrations to be applied before testing."),
      { code: "CI_SCHEMA_MISSING" },
    );
  }
}
try {
  await client.connect();
  console.log("PostgreSQL connection: passed");
  await client.query("begin");
  const { rows } = await client.query(
    "select to_regclass('public.memberships') is not null as installed",
  );
  console.log(`Foundation schema installed: ${rows[0].installed}`);
  requireAppliedSchema(rows[0].installed);
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
    requireAppliedSchema(installed.rowCount);
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
    requireAppliedSchema(rows[0].installed);
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
    const administration = await client.query(
      "select to_regprocedure('public.administer_tenant_membership(uuid,uuid,timestamptz,text[],text)') is not null as installed",
    );
    requireAppliedSchema(administration.rows[0].installed);
    if (!administration.rows[0].installed) {
      const migration = readdirSync("supabase/migrations").find((name) =>
        name.endsWith("_sprint_0_administration.sql"),
      );
      if (!migration) throw new Error("Administration migration is missing.");
      await client.query(
        readFileSync(`supabase/migrations/${migration}`, "utf8"),
      );
    }
    await client.query(
      readFileSync("supabase/tests/authentication_lifecycle.sql", "utf8"),
    );
    console.log("Invitation lifecycle assertions: passed");
    await client.query(
      readFileSync("supabase/tests/administration.sql", "utf8"),
    );
    console.log("Administration and transactional audit assertions: passed");
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

if (!process.exitCode && env.CI_ENFORCE_INTEGRATION === "1") {
  const { testAdministrationConcurrency } =
    await import("./tests/administration-concurrency.mjs");
  await testAdministrationConcurrency(env);
}
