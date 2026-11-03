import test from "node:test";
import assert from "node:assert/strict";
import { timestampTestOptions } from "../../scripts/tests/timestamp-hardening.mjs";

const local = {
  DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  CI_ENFORCE_INTEGRATION: "1",
  DATABASE_TEST_LOCAL: "1",
};

test("timestamp upgrade fixtures reject missing opt-in before connecting", () => {
  for (const flag of ["CI_ENFORCE_INTEGRATION", "DATABASE_TEST_LOCAL"]) {
    assert.throws(() => timestampTestOptions({ ...local, [flag]: undefined }));
  }
  assert.equal(timestampTestOptions(local).ssl, false);
});

test("timestamp upgrade fixtures cannot downgrade hosted or deceptive endpoints", () => {
  for (const host of [
    "db.example.com",
    "localhost.evil.example",
    "127.0.0.1.evil.example",
  ]) {
    assert.throws(() =>
      timestampTestOptions({
        ...local,
        DATABASE_URL: `postgresql://user:pass@${host}/postgres`,
      }),
    );
  }
});
