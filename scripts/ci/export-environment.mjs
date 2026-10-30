import { appendFileSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { randomBytes } from "node:crypto";
import { localEnvironment } from "./environment.mjs";

if (!process.env.GITHUB_ENV)
  throw new Error("This exporter is for GitHub's disposable runner only.");
const status = parseEnv(readFileSync(process.argv[2], "utf8"));
const env = {
  ...localEnvironment(status),
  SMTP_PASSWORD: randomBytes(24).toString("hex"),
  CI_TEST_PASSWORD: randomBytes(24).toString("hex") + "Aa1!",
  CI_TEST_UPDATED_PASSWORD: randomBytes(24).toString("hex") + "Bb2!",
};
for (const value of [
  ...Object.entries(status)
    .filter(([key]) => /KEY|TOKEN|SECRET|DB_URL/.test(key))
    .map(([, value]) => value),
  env.SMTP_PASSWORD,
  env.CI_TEST_PASSWORD,
  env.CI_TEST_UPDATED_PASSWORD,
]) {
  if (value)
    console.log(
      `::add-mask::${value.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A")}`,
    );
}
appendFileSync(
  process.env.GITHUB_ENV,
  Object.entries(env)
    .map(([key, value]) => {
      if (/[\r\n]/.test(value))
        throw new Error("Unexpected multiline CI environment value.");
      return `${key}=${value}\n`;
    })
    .join(""),
);
console.log(
  "Disposable local test configuration exported; no hosted project credentials used.",
);
