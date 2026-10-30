import { readFileSync } from "node:fs";

export function loopbackUrl(value, protocols = ["http:"]) {
  const url = new URL(value);
  if (
    !protocols.includes(url.protocol) ||
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
  ) {
    throw new Error("Isolated CI services must use a loopback URL.");
  }
  return url;
}

export function databaseTestOptions(env) {
  const url = new URL(env.DATABASE_URL);
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("Invalid database protocol.");
  for (const key of [
    "sslmode",
    "sslcert",
    "sslkey",
    "sslrootcert",
    "ssl",
    "uselibpqcompat",
  ])
    url.searchParams.delete(key);
  let ssl;
  if (env.DATABASE_TEST_LOCAL === "1") {
    loopbackUrl(url.toString(), ["postgres:", "postgresql:"]);
    ssl = false;
  } else {
    ssl = {
      ca: readFileSync(
        env.DATABASE_SSL_ROOT_CERT || "supabase/certs/prod-ca-2021.crt",
        "utf8",
      ),
      rejectUnauthorized: true,
    };
  }
  return {
    connectionString: url.toString(),
    ssl,
    connectionTimeoutMillis: 15000,
    statement_timeout: 30000,
  };
}

export function localEnvironment(status) {
  loopbackUrl(status.API_URL);
  loopbackUrl(status.DB_URL, ["postgres:", "postgresql:"]);
  if (
    !status.PUBLISHABLE_KEY?.startsWith("sb_publishable_") ||
    !status.SECRET_KEY?.startsWith("sb_secret_")
  ) {
    throw new Error(
      "Local Supabase must supply publishable and secret keys; authenticated tests cannot be skipped.",
    );
  }
  return {
    NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: status.SECRET_KEY,
    DATABASE_URL: status.DB_URL,
    DATABASE_TEST_LOCAL: "1",
    CI_ENFORCE_INTEGRATION: "1",
    NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3102",
    PLAYWRIGHT_BASE_URL: "http://127.0.0.1:3102",
    E2E_SERVER_MODE: "production",
    AUTH_MAILBOX_URL: "http://127.0.0.1:54324",
    SMTP_MAILBOX_URL: "http://127.0.0.1:8025",
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: "1025",
    SMTP_USER: "scoges-ci",
    SMTP_FROM: "ScoGes CI <noreply@example.invalid>",
  };
}

export function browserSummary(report) {
  const stats = report.stats;
  if (
    !stats ||
    ["expected", "unexpected", "flaky", "skipped"].some(
      (key) => !Number.isInteger(stats[key]) || stats[key] < 0,
    )
  ) {
    throw new Error("Browser report is missing valid test totals.");
  }
  return {
    passed: stats.expected,
    failed: stats.unexpected,
    flaky: stats.flaky,
    skipped: stats.skipped,
    success:
      stats.expected > 0 &&
      stats.unexpected === 0 &&
      stats.flaky === 0 &&
      stats.skipped === 0 &&
      !report.errors?.length,
  };
}
