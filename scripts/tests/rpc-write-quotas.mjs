import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID, randomBytes } from "node:crypto";
import { databaseTestOptions, loopbackUrl } from "../ci/environment.mjs";

export function rpcQuotaTestOptions(env) {
  if (env.CI_ENFORCE_INTEGRATION !== "1" || env.DATABASE_TEST_LOCAL !== "1")
    throw Error("RPC quota fixtures require isolated local CI.");
  loopbackUrl(env.DATABASE_URL, ["postgres:", "postgresql:"]);
  return databaseTestOptions(env);
}
const source = (name) =>
  readFileSync(new URL("../../supabase/" + name, import.meta.url), "utf8");
const migration = source(
  "migrations/20261111051704_direct_rpc_write_quotas.sql",
);
async function snapshot(client) {
  const functions = await client.query(
    "select oid,proname,proowner,proacl::text,prosrc,proconfig,prosecdef from pg_proc where pronamespace='public'::regnamespace and proname in ('create_tenant_with_admin','administer_tenant_membership','update_tenant_settings','issue_tenant_invitation','invite_tenant_member','record_invitation_delivery','accept_tenant_invitation') order by oid",
  );
  const tables = {};
  for (const table of [
    "tenants",
    "profiles",
    "tenant_settings",
    "memberships",
    "membership_roles",
    "invitations",
    "audit_events",
  ])
    tables[table] = (
      await client.query(
        "select md5(coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text)::text,'')) as fingerprint from public." +
          table +
          " t",
      )
    ).rows[0].fingerprint;
  return { functions: functions.rows, tables };
}
async function race(env, actor, statements) {
  return Promise.all(
    statements.map(async (statement) => {
      const client = new pg.Client(rpcQuotaTestOptions(env));
      await client.connect();
      try {
        await client.query("begin");
        await client.query("set local role authenticated");
        await client.query(
          "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
          [actor, JSON.stringify({ sub: actor, role: "authenticated" })],
        );
        await client.query(statement.sql, statement.args);
        await client.query("commit");
        return "written";
      } catch (error) {
        await client.query("rollback");
        if (error.code === "PT429" && error.message === "rpc_rate_limited")
          return "limited";
        throw Error("RPC quota concurrency failed unexpectedly.");
      } finally {
        await client.end();
      }
    }),
  );
}
export async function testRpcWriteQuotas(env) {
  const client = new pg.Client(rpcQuotaTestOptions(env));
  let stage = "connect";
  await client.connect();
  try {
    stage = "fresh";
    await client.query("begin");
    await client.query(source("tests/rpc_quota_fixtures.sql"));
    await client.query(source("tests/rpc_write_quotas.sql"));
    await client.query("rollback");
    console.log(
      "Direct RPC quota privacy/authorization/expiry/rollback assertions: passed",
    );

    stage = "upgrade";
    await client.query("begin");
    // Reconstruct only the exact pre-migration state, never hosted or unguarded.
    await client.query(
      "drop trigger a_enforce_rpc_write_quota on public.audit_events; drop function app_private.enforce_rpc_write_quota(); drop function app_private.rpc_write_policy(text); drop table app_private.rpc_write_windows; drop schema app_private;",
    );
    await client.query(source("tests/rpc_quota_fixtures.sql"));
    await client.query(
      "insert into public.audit_events(tenant_id,actor_user_id,action,target_type,created_at) select current_setting('quota_test.tenant_1')::uuid,current_setting('quota_test.actor')::uuid,action,'test',clock_timestamp()-interval '1 minute' from unnest(array['tenant.created','tenant.settings.updated','member.invited','member.invitation_accepted','member.invitation_sent']) as action cross join generate_series(1,70); insert into public.audit_events(tenant_id,actor_user_id,action,target_type,created_at) values(current_setting('quota_test.tenant_1')::uuid,current_setting('quota_test.recipient')::uuid,'tenant.created','test',clock_timestamp()-interval '2 hours')",
    );
    const before = await snapshot(client);
    await client.query(migration);
    assert.deepEqual(await snapshot(client), before);
    const counts = await client.query(
      "select scope,cardinality(occurred_at) as count from app_private.rpc_write_windows where actor_id=current_setting('quota_test.actor')::uuid order by scope",
    );
    assert.deepEqual(counts.rows, [
      { scope: "acceptance", count: 20 },
      { scope: "administration", count: 60 },
      { scope: "invitation", count: 20 },
      { scope: "invitation_delivery", count: 40 },
      { scope: "onboarding", count: 5 },
    ]);
    assert.equal(
      (
        await client.query(
          "select count(*)::int as n from app_private.rpc_write_windows where actor_id=current_setting('quota_test.recipient')::uuid",
        )
      ).rows[0].n,
      0,
    );
    await client.query("set local role authenticated");
    await client.query("select pg_temp.quota_actor('actor')");
    await client.query(
      "select pg_temp.quota_reject('select public.create_tenant_with_admin(''Blocked'',''test-''||gen_random_uuid(),''TG'',''XOF'',''UTC'',''fr'',auth.uid())','PT429')",
    );
    await client.query("rollback");
    console.log(
      "Direct RPC quota upgrade history and function/grant/data preservation: passed",
    );
  } catch (error) {
    throw Error(
      "Direct RPC quota verification failed at " +
        stage +
        " (" +
        (error.code ?? "assertion") +
        ").",
    );
  } finally {
    await client.query("rollback").catch(() => {});
    await client.end();
  }
  await testRpcQuotaConcurrency(env);
  await testRpcHttpBackstop(env);
}
async function testRpcQuotaConcurrency(env) {
  const owner = new pg.Client(rpcQuotaTestOptions(env));
  let ids;
  await owner.connect();
  try {
    await owner.query("begin");
    await owner.query(source("tests/rpc_quota_fixtures.sql"));
    ids = (
      await owner.query(
        "select current_setting('quota_test.actor') as actor,current_setting('quota_test.recipient') as recipient,current_setting('quota_test.member') as member,current_setting('quota_test.tenant_1') as tenant1,current_setting('quota_test.tenant_2') as tenant2",
      )
    ).rows[0];
    await owner.query(
      "insert into app_private.rpc_write_windows values($1,'onboarding',array_fill(clock_timestamp(),array[4])),($1,'administration',array_fill(clock_timestamp(),array[59]))",
      [ids.actor],
    );
    const settings = (
      await owner.query(
        "select tenant_id,updated_at::text from public.tenant_settings where tenant_id in ($1,$2) order by tenant_id",
        [ids.tenant1, ids.tenant2],
      )
    ).rows;
    await owner.query("commit");
    const onboarding = await race(
      env,
      ids.actor,
      [0, 1].map(() => ({
        sql: "select public.create_tenant_with_admin('Quota race',$1,'TG','XOF','UTC','fr',$2)",
        args: ["test-" + randomUUID(), ids.actor],
      })),
    );
    assert.equal(onboarding.filter((x) => x === "written").length, 1);
    assert.equal(onboarding.filter((x) => x === "limited").length, 1);
    const admin = await race(
      env,
      ids.actor,
      settings.map((row) => ({
        sql: "select public.update_tenant_settings($1,$2,'US','XOF','UTC','fr')",
        args: [row.tenant_id, row.updated_at],
      })),
    );
    assert.equal(admin.filter((x) => x === "written").length, 1);
    assert.equal(admin.filter((x) => x === "limited").length, 1);
    const counts = (
      await owner.query(
        "select (select count(*)::int from public.tenants where created_by=$1) as tenants,(select count(*)::int from public.tenant_settings where tenant_id in ($2,$3) and country='US') as settings,(select count(*)::int from public.audit_events where actor_user_id=$1) as audit",
        [ids.actor, ids.tenant1, ids.tenant2],
      )
    ).rows[0];
    assert.deepEqual(counts, { tenants: 1, settings: 1, audit: 2 });
    console.log(
      "Concurrent direct RPC cross-tenant quotas and atomic audit assertions: passed",
    );
  } catch {
    throw Error("Direct RPC quota concurrency assertions failed.");
  } finally {
    await owner.query("rollback");
    if (ids) {
      await owner.query("begin");
      await owner.query(
        "delete from public.audit_events where actor_user_id in ($1,$2,$3)",
        [ids.actor, ids.recipient, ids.member],
      );
      await owner.query(
        "delete from public.tenants where id in ($1,$2) or created_by=$3",
        [ids.tenant1, ids.tenant2, ids.actor],
      );
      await owner.query("delete from auth.users where id in ($1,$2,$3)", [
        ids.actor,
        ids.recipient,
        ids.member,
      ]);
      await owner.query("commit");
    }
    await owner.end();
  }
}

async function testRpcHttpBackstop(env) {
  const db = new pg.Client(rpcQuotaTestOptions(env));
  loopbackUrl(env.NEXT_PUBLIC_SUPABASE_URL);
  const options = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  };
  const admin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    options,
  );
  const auth = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    options,
  );
  let user;
  await db.connect();
  try {
    const email = "quota-" + randomUUID() + "@example.invalid";
    const password = randomBytes(24).toString("base64url") + "Aa1!";
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error || !created.data.user)
      throw Error("Synthetic user setup failed.");
    user = created.data.user.id;
    const signed = await auth.auth.signInWithPassword({ email, password });
    if (signed.error || !signed.data.session)
      throw Error("Synthetic authentication failed.");
    const headers = {
      apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      Authorization: "Bearer " + signed.data.session.access_token,
      "Content-Type": "application/json",
    };
    for (let i = 0; i < 6; i++) {
      const response = await fetch(
        new URL(
          "/rest/v1/rpc/create_tenant_with_admin",
          env.NEXT_PUBLIC_SUPABASE_URL,
        ),
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenant_name: "Direct RPC quota",
            tenant_slug: "test-" + randomUUID(),
            tenant_country: "TG",
            tenant_base_currency: "XOF",
            tenant_timezone: "UTC",
            tenant_default_locale: "fr",
            actor_user_id: user,
          }),
          signal: AbortSignal.timeout(15000),
        },
      );
      assert.equal(response.status, i < 5 ? 200 : 429);
      if (i === 5) {
        const error = await response.json();
        assert.equal(error.code, "PT429");
        assert.equal(error.message, "rpc_rate_limited");
      } else await response.arrayBuffer();
    }
    const count = await db.query(
      "select (select count(*)::int from public.tenants where created_by=$1) as tenants,(select count(*)::int from public.audit_events where actor_user_id=$1 and action='tenant.created') as audit",
      [user],
    );
    assert.deepEqual(count.rows[0], { tenants: 5, audit: 5 });
    console.log(
      "Authenticated direct PostgREST RPC HTTP 429 and atomicity assertions: passed",
    );
  } catch {
    throw Error(
      "Direct PostgREST RPC quota verification failed; credentials and payloads withheld.",
    );
  } finally {
    await auth.auth.signOut({ scope: "global" }).catch(() => {});
    if (user) {
      await db.query("begin");
      await db.query("delete from public.audit_events where actor_user_id=$1", [
        user,
      ]);
      await db.query("delete from public.tenants where created_by=$1", [user]);
      await db.query("commit");
      const removed = await admin.auth.admin.deleteUser(user);
      if (removed.error) throw Error("Synthetic RPC account cleanup failed.");
    }
    await db.end();
  }
}
