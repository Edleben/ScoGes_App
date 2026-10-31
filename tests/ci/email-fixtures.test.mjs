import test from "node:test";
import assert from "node:assert/strict";
import { assertEmailFixtureEnvironment } from "../../scripts/ci/email-fixtures.mjs";

const local = {
  CI_ENFORCE_INTEGRATION: "1",
  DATABASE_TEST_LOCAL: "1",
  DATABASE_URL: "postgresql://test:fixture@127.0.0.1:54322/postgres",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3102",
  AUTH_MAILBOX_URL: "http://127.0.0.1:54324",
  SMTP_MAILBOX_URL: "http://127.0.0.1:8025",
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: "1025",
};
test("email expiry/cleanup fixtures reject hosted and deceptive service URLs", () => {
  assert.doesNotThrow(() => assertEmailFixtureEnvironment(local));
  for (const key of [
    "DATABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_APP_URL",
    "AUTH_MAILBOX_URL",
    "SMTP_MAILBOX_URL",
  ])
    for (const host of [
      "project.supabase.co",
      "localhost.evil.example",
      "127.0.0.1.evil.example",
    ])
      assert.throws(() =>
        assertEmailFixtureEnvironment({
          ...local,
          [key]: `${key === "DATABASE_URL" ? "postgresql" : "http"}://${host}/test`,
        }),
      );
});
test("email mutation fixtures cannot opt into a hosted database through partial flags", () => {
  for (const key of ["CI_ENFORCE_INTEGRATION", "DATABASE_TEST_LOCAL"])
    assert.throws(() =>
      assertEmailFixtureEnvironment({ ...local, [key]: "0" }),
    );
  assert.throws(() =>
    assertEmailFixtureEnvironment({ ...local, SMTP_HOST: "smtp.gmail.com" }),
  );
});
