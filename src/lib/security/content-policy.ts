import { randomBytes } from "node:crypto";

function backendOrigin(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password || /[;\s*'"]/.test(url.origin))
      return null;
    if (
      url.protocol === "https:" ||
      (url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    )
      return url.origin;
  } catch {
    // Invalid configuration must never become an injected policy source.
  }
  return null;
}

export function createContentPolicy(options: {
  development: boolean;
  https: boolean;
  backendUrl?: string;
}) {
  const nonce = randomBytes(18).toString("base64");
  const origin = backendOrigin(options.backendUrl);
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${options.development ? " 'unsafe-eval'" : ""}`,
    "script-src-attr 'none'",
    `style-src 'self' ${options.development ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    "style-src-attr 'none'",
    `connect-src 'self'${origin ? ` ${origin}` : ""}${options.development ? " ws: wss:" : ""}`,
    "img-src 'self' data:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
  ];
  // Local production-mode browser tests still use HTTP. Do not upgrade localhost.
  if (!options.development && options.https)
    directives.push("upgrade-insecure-requests");
  return { nonce, policy: directives.join("; ") };
}
