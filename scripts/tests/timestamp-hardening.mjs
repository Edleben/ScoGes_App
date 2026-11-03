import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import pg from "pg";
import { databaseTestOptions, loopbackUrl } from "../ci/environment.mjs";

const migration = new URL(
  "../../supabase/migrations/20261103155717_pin_timestamp_helper_search_path.sql",
  import.meta.url,
);

export function timestampTestOptions(env) {
  if (env.CI_ENFORCE_INTEGRATION !== "1" || env.DATABASE_TEST_LOCAL !== "1") {
    throw new Error("Timestamp upgrade fixtures require isolated local CI.");
  }
  loopbackUrl(env.DATABASE_URL, ["postgres:", "postgresql:"]);
  return databaseTestOptions(env);
}

async function functionSnapshot(client) {
  const { rows } = await client.query(`
    select oid, proowner, proacl::text, prosrc, prosecdef, provolatile, proparallel,
      prorettype, proargtypes::text
    from pg_proc where oid = 'public.touch_updated_at()'::regprocedure
  `);
  return rows[0];
}

async function fixtureSnapshot(client) {
  const { rows } = await client.query(`
    select jsonb_build_object('tenant', to_jsonb(t), 'profile', to_jsonb(p),
      'settings', to_jsonb(s), 'membership', to_jsonb(m)) as data
    from public.tenants t
    join public.tenant_settings s on s.tenant_id = t.id
    join public.memberships m on m.tenant_id = t.id
    join public.profiles p on p.id = m.user_id
    where t.id = current_setting('timestamp_test.tenant')::uuid
  `);
  assert.equal(rows.length, 1, "Timestamp fixture is missing.");
  return rows[0].data;
}

export async function testTimestampHardening(env) {
  // Validate before connecting: the upgrade scenario temporarily restores the old
  // search path and creates a shadow function. Never run this on hosted Supabase.
  const client = new pg.Client(timestampTestOptions(env));
  let scenario = "connection";
  try {
    await client.connect();
    for (const upgrade of [false, true]) {
      scenario = upgrade ? "upgrade" : "fresh-install";
      await client.query("begin");
      try {
        if (upgrade) {
          await client.query(
            "alter function public.touch_updated_at() reset search_path",
          );
          const { rows } = await client.query(
            "select proconfig from pg_proc where oid = 'public.touch_updated_at()'::regprocedure",
          );
          assert.ok(
            !rows[0].proconfig?.some((value) =>
              value.startsWith("search_path="),
            ),
            "Upgrade fixture must start with the previous helper configuration.",
          );
        }
        const beforeFunction = await functionSnapshot(client);
        await client.query(
          readFileSync(
            new URL(
              "../../supabase/tests/timestamp_fixtures.sql",
              import.meta.url,
            ),
            "utf8",
          ),
        );
        const beforeData = await fixtureSnapshot(client);
        if (upgrade) await client.query(readFileSync(migration, "utf8"));
        assert.deepEqual(await functionSnapshot(client), beforeFunction);
        assert.deepEqual(await fixtureSnapshot(client), beforeData);
        await client.query(
          readFileSync(
            new URL(
              "../../supabase/tests/timestamp_hardening.sql",
              import.meta.url,
            ),
            "utf8",
          ),
        );
      } finally {
        await client.query("rollback");
      }
      console.log(
        `Timestamp hardening ${upgrade ? "upgrade" : "fresh-install"} assertions: passed`,
      );
    }
  } catch (error) {
    // No connection URLs, SQL payloads, or synthetic record contents in output.
    throw new Error(
      `Timestamp hardening ${scenario} verification failed (${error.code ?? "assertion"}).`,
    );
  } finally {
    await client.end();
  }
}
