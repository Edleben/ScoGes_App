import test from "node:test";
import assert from "node:assert/strict";
import { rpcQuotaTestOptions } from "../../scripts/tests/rpc-write-quotas.mjs";
test("RPC quota fixtures reject missing isolated opt-in before connecting", () => {
  for (const env of [
    {},
    { CI_ENFORCE_INTEGRATION: "1" },
    { DATABASE_TEST_LOCAL: "1" },
  ])
    assert.throws(() => rpcQuotaTestOptions(env));
});
test("RPC quota fixtures reject hosted and deceptive endpoints", () => {
  for (const host of [
    "db.example.com",
    "localhost.evil.example",
    "127.0.0.1.evil.example",
  ])
    assert.throws(() =>
      rpcQuotaTestOptions({
        CI_ENFORCE_INTEGRATION: "1",
        DATABASE_TEST_LOCAL: "1",
        DATABASE_URL: "postgresql://user:pass@" + host + "/postgres",
      }),
    );
  assert.equal(
    rpcQuotaTestOptions({
      CI_ENFORCE_INTEGRATION: "1",
      DATABASE_TEST_LOCAL: "1",
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    }).ssl,
    false,
  );
});
