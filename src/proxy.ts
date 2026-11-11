import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseBrowserConfig } from "@/lib/supabase/config";
import { getLocale } from "@/i18n/messages";
import { localeHeader } from "@/i18n/navigation";
import { createContentPolicy } from "@/lib/security/content-policy";

export async function proxy(request: NextRequest) {
  const { nonce, policy } = createContentPolicy({
    development: process.env.NODE_ENV === "development",
    https: request.nextUrl.protocol === "https:",
    backendUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
  // Next.js reads the request CSP to nonce framework scripts during rendering.
  // Always overwrite incoming values; a client may not choose the policy/nonce.
  request.headers.set("x-nonce", nonce);
  request.headers.set("Content-Security-Policy", policy);
  // Overwrite client headers; this value selects presentation, never authority.
  request.headers.set(
    localeHeader,
    getLocale(request.nextUrl.searchParams.get("locale")),
  );
  let response = NextResponse.next({ request: { headers: request.headers } });
  function finish() {
    response.headers.set("Content-Security-Policy", policy);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }
  const path = request.nextUrl.pathname;
  const needsSession =
    ["/login", "/signup", "/onboarding"].includes(path) ||
    ["/auth", "/invitations", "/dashboard"].some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    );
  if (!needsSession) return finish();
  const config = getSupabaseBrowserConfig();
  if (!config) return finish();
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookies, headers) {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: request.headers } });
        cookies.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers ?? {}).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
      },
    },
  });
  // Refresh cookies here; server pages/actions still verify identity with getUser.
  await supabase.auth.getUser();
  return finish();
}

export const config = {
  matcher: [
    "/((?!api(?:/|$)|_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
