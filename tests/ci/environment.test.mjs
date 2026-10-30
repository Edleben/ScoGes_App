import test from "node:test";
import assert from "node:assert/strict";
import {
  databaseTestOptions,
  localEnvironment,
  browserSummary,
} from "../../scripts/ci/environment.mjs";

test("local database exception rejects hosted endpoints and deceptive hostnames", () => {
  for (const host of [
    "db.example.com",
    "localhost.evil.example",
    "127.0.0.1.evil.example",
  ]) {
    assert.throws(() =>
      databaseTestOptions({
        DATABASE_URL: `postgresql://user:pass@${host}/postgres`,
        DATABASE_TEST_LOCAL: "1",
      }),
    );
  }
  assert.equal(
    databaseTestOptions({
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
      DATABASE_TEST_LOCAL: "1",
    }).ssl,
    false,
  );
});
test("remote tests always verify TLS even if URL parameters request otherwise", () => {
  const result = databaseTestOptions({
    DATABASE_URL:
      "postgresql://user:pass@db.example.com/postgres?sslmode=disable",
  });
  assert.equal(result.ssl.rejectUnauthorized, true);
  assert.ok(!result.connectionString.includes("sslmode"));
});
test("CI setup requires local services and new keys, with no hosted fallback", () => {
  const status = {
    API_URL: "http://127.0.0.1:54321",
    DB_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    PUBLISHABLE_KEY: "sb_publishable_fixture",
    SECRET_KEY: "sb_secret_fixture",
  };
  assert.equal(localEnvironment(status).CI_ENFORCE_INTEGRATION, "1");
  assert.throws(() =>
    localEnvironment({ ...status, API_URL: "https://project.supabase.co" }),
  );
  assert.throws(() => localEnvironment({ ...status, SECRET_KEY: undefined }));
});
test("browser gates fail closed on failures, skips, retries or missing reports", () => {
  const report = {
    stats: { expected: 8, unexpected: 0, flaky: 0, skipped: 0 },
  };
  assert.equal(browserSummary(report).success, true);
  for (const key of ["unexpected", "flaky", "skipped"])
    assert.equal(
      browserSummary({ stats: { ...report.stats, [key]: 1 } }).success,
      false,
    );
  assert.equal(
    browserSummary({ stats: { ...report.stats, expected: 0 } }).success,
    false,
  );
  assert.throws(() => browserSummary({}));
});
