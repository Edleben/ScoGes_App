import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

const env = {
  ...(existsSync(".env.local")
    ? parseEnv(readFileSync(".env.local", "utf8"))
    : {}),
  ...process.env,
};
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key)
  throw new Error("Supabase public URL and publishable key are required.");

let failed = false;
for (const [label, path] of [
  ["Auth", "/auth/v1/settings"],
  ["Membership schema", "/rest/v1/memberships?select=id&limit=0"],
]) {
  try {
    const response = await fetch(new URL(path, url), {
      headers: { apikey: key },
      signal: AbortSignal.timeout(15000),
    });
    console.log(`${label}: HTTP ${response.status}`);
    if (!response.ok) failed = true;
  } catch {
    console.error(
      `${label}: connection failed (check network and configuration).`,
    );
    failed = true;
  }
}
process.exitCode = failed ? 1 : 0;
