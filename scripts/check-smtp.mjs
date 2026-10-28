import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import nodemailer from "nodemailer";

const env = {
  ...(existsSync(".env.local")
    ? parseEnv(readFileSync(".env.local", "utf8"))
    : {}),
  ...process.env,
};
const missing = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_FROM",
].filter((name) => !env[name]);
if (missing.length) {
  console.error(`SMTP configuration incomplete: ${missing.join(", ")}`);
  process.exitCode = 1;
} else {
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: Number(env.SMTP_PORT) === 465,
    requireTLS: true,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  try {
    await transport.verify();
    console.log("SMTP connection/authentication verified. No email was sent.");
  } catch {
    console.error(
      "SMTP verification failed. Check credentials, TLS and network access.",
    );
    process.exitCode = 1;
  } finally {
    transport.close();
  }
}
