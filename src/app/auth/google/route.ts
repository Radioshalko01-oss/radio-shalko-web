import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.generated";
import {
  AUTH_NEXT_COOKIE,
  AUTH_ORIGIN_COOKIE,
  oauthCallbackRedirectUrl,
  resolveOAuthOrigin,
  safeAuthNextPath,
} from "@/lib/site/site-url";

/**
 * Inicia OAuth con Google desde el servidor usando el Host del request.
 * Evita que redirectTo quede desalineado con el origen real (p. ej. IP LAN en iPhone).
 */
export async function GET(request: NextRequest) {
  const originParam = request.nextUrl.searchParams.get("origin");
  const originCookie = request.cookies.get(AUTH_ORIGIN_COOKIE)?.value;
  const origin = resolveOAuthOrigin(request.headers, originParam, originCookie);
  const next = safeAuthNextPath(request.nextUrl.searchParams.get("next") ?? undefined);
  const loginUrl = new URL("/login", origin);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    loginUrl.searchParams.set("error", "auth");
    loginUrl.searchParams.set("detail", "missing_supabase_env");
    return NextResponse.redirect(loginUrl);
  }

  let oauthResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        oauthResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          oauthResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const redirectTo = oauthCallbackRedirectUrl(origin);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    console.error("[auth/google] signInWithOAuth falló:", error?.message ?? "sin URL");
    loginUrl.searchParams.set("error", "auth");
    loginUrl.searchParams.set("detail", error?.message ?? "oauth_start_failed");
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(data.url);
  oauthResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie);
  });

  const secure = origin.startsWith("https://");
  response.cookies.set(AUTH_NEXT_COOKIE, encodeURIComponent(next), {
    path: "/",
    maxAge: 600,
    sameSite: "lax",
    secure,
  });
  response.cookies.set(AUTH_ORIGIN_COOKIE, origin, {
    path: "/",
    maxAge: 600,
    sameSite: "lax",
    secure,
  });

  return response;
}
