import pg from "pg";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { databaseTestOptions, loopbackUrl } from "../ci/environment.mjs";

// Committed race fixtures are restricted to disposable local CI; hosted tests roll back.
export async function testAdministrationConcurrency(env) {
  if (env.CI_ENFORCE_INTEGRATION !== "1" || env.DATABASE_TEST_LOCAL !== "1")
    throw new Error("Concurrent fixtures require explicitly isolated CI.");
  loopbackUrl(env.DATABASE_URL, ["postgres:", "postgresql:"]);
  const owner = new pg.Client(databaseTestOptions(env));
  const tenant = randomUUID(),
    users = [randomUUID(), randomUUID()],
    memberships = [randomUUID(), randomUUID()];
  await owner.connect();
  try {
    await owner.query("begin");
    await owner.query(
      "insert into public.tenants(id,name,slug) values($1,'CI administration race',$2)",
      [tenant, `test-${tenant}`],
    );
    for (let i = 0; i < 2; i++) {
      await owner.query("insert into auth.users(id,email) values($1,$2)", [
        users[i],
        `${users[i]}@example.invalid`,
      ]);
      await owner.query("insert into public.profiles(id,email) values($1,$2)", [
        users[i],
        `${users[i]}@example.invalid`,
      ]);
      await owner.query(
        "insert into public.memberships(id,tenant_id,user_id) values($1,$2,$3)",
        [memberships[i], tenant, users[i]],
      );
      await owner.query(
        "insert into public.membership_roles(membership_id,role_id) select $1,id from public.roles where key='tenant_admin'",
        [memberships[i]],
      );
    }
    await owner.query("commit");
    for (const mixed of [false, true]) {
      await owner.query(
        "update public.memberships set status='active' where tenant_id=$1",
        [tenant],
      );
      for (const id of memberships) {
        await owner.query(
          "delete from public.membership_roles where membership_id=$1",
          [id],
        );
        await owner.query(
          "insert into public.membership_roles(membership_id,role_id) select $1,id from public.roles where key='tenant_admin'",
          [id],
        );
      }
      const revisions = await owner.query(
        "select id,updated_at::text from public.memberships where tenant_id=$1",
        [tenant],
      );
      const race = await Promise.all(
        users.map(async (user, i) => {
          const client = new pg.Client(databaseTestOptions(env));
          await client.connect();
          try {
            await client.query("begin");
            await client.query("set local role authenticated");
            await client.query(
              "select set_config('request.jwt.claim.sub',$1,true)",
              [user],
            );
            await client.query(
              "select public.administer_tenant_membership($1,$2,$3,$4,$5)",
              [
                tenant,
                memberships[i],
                revisions.rows.find((r) => r.id === memberships[i]).updated_at,
                mixed && i === 0 ? null : ["cashier"],
                mixed && i === 0 ? "inactive" : null,
              ],
            );
            await client.query("commit");
            return "changed";
          } catch (error) {
            await client.query("rollback");
            if (error.message !== "last_admin")
              throw new Error("Concurrent administration failed unexpectedly.");
            return "protected";
          } finally {
            await client.end();
          }
        }),
      );
      assert.equal(race.filter((r) => r === "changed").length, 1);
      assert.equal(race.filter((r) => r === "protected").length, 1);
      const count = await owner.query(
        "select count(*)::int as total from public.memberships m join public.membership_roles mr on mr.membership_id=m.id join public.roles r on r.id=mr.role_id where m.tenant_id=$1 and m.status='active' and r.key='tenant_admin'",
        [tenant],
      );
      assert.equal(count.rows[0].total, 1);
    }
    const audit = await owner.query(
      "select count(*)::int as total from public.audit_events where tenant_id=$1",
      [tenant],
    );
    assert.equal(audit.rows[0].total, 2);
    console.log(
      "Concurrent administrator removal and audit assertions: passed",
    );
  } finally {
    await owner.query("rollback");
    await owner.query("delete from public.audit_events where tenant_id=$1", [
      tenant,
    ]);
    await owner.query("delete from public.tenants where id=$1", [tenant]);
    for (const id of users)
      await owner.query("delete from auth.users where id=$1", [id]);
    await owner.end();
  }
}
