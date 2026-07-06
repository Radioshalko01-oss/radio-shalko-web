import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { AUTH_NEXT_COOKIE, requestSiteOrigin, safeAuthNextPath } from "@/lib/site/site-url";

/**
 * Callback OAuth (PKCE). Canjea el `code` por sesión y redirige a `next`.
 *
 * `next` se lee de cookie rs_auth_next (seteada antes de signInWithOAuth).
 * Fallback: query ?next= para compatibilidad con URLs antiguas.
 */
export async function GET(request: Request) {
  const requestHeaders = new Headers(request.headers);
  const origin = requestSiteOrigin(requestHeaders);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  const cookieStore = await cookies();
  const nextFromCookie = cookieStore.get(AUTH_NEXT_COOKIE)?.value;
  const next = safeAuthNextPath(
    nextFromCookie ? decodeURIComponent(nextFromCookie) : searchParams.get("next") ?? undefined,
    "/",
  );

  const providerError = searchParams.get("error");
  const providerErrorDescription =
    searchParams.get("error_description") ?? searchParams.get("error_code");

  const fail = (detail: string) => {
    const url = new URL(`${origin}/login`);
    url.searchParams.set("error", "auth");
    url.searchParams.set("detail", detail);
    const response = NextResponse.redirect(url);
    response.cookies.set(AUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  };

  if (providerError) {
    console.error("[auth/callback] provider error:", {
      error: providerError,
      description: providerErrorDescription,
    });
    return fail(providerErrorDescription || providerError);
  }

  if (!code) {
    console.error(
      "[auth/callback] missing `code` en la URL de retorno. URL:",
      request.url,
    );
    return fail("missing_code");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession falló:", {
      message: error.message,
      status: error.status,
      name: error.name,
    });
    return fail(error.message);
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  response.cookies.set(AUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
