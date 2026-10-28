import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/supabase/config";
import { authDestination } from "@/modules/identity/auth-navigation";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = authDestination(request.nextUrl.searchParams.get("next"));
  const locale =
    request.nextUrl.searchParams.get("locale") === "en" ? "en" : "fr";
  const supabase = await createSupabaseServerClient();
  let destination = `/login?notice=invalidLink&locale=${locale}`;
  if (code && code.length <= 2048 && supabase) {
    const flowId = request.nextUrl.searchParams.get("sb_flow_id");
    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId && flowId.length <= 128 ? { flowId } : undefined,
    );
    if (!error) destination = `${next}?locale=${locale}`;
  }
  const response = NextResponse.redirect(new URL(destination, getAppUrl()));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
