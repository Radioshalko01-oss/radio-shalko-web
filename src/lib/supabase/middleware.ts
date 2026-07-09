import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.generated";
import { isAdminUser } from "@/lib/auth/is-admin";

/**
 * En Vercel Preview, cada deploy tiene un subdominio distinto (p. ej. …-degn345yc-…).
 * OAuth/PKCE y cookies no funcionan si Supabase rechaza ese host y cae en la Site URL
 * de producción. Redirigimos al host estable de la rama (VERCEL_BRANCH_URL).
 */
function redirectPreviewToStableBranch(request: NextRequest): NextResponse | null {
  if (process.env.VERCEL_ENV !== "preview") return null;

  const branchHost = process.env.VERCEL_BRANCH_URL?.trim();
  if (!branchHost) return null;

  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host")?.trim();
  if (!host || host === branchHost) return null;

  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/auth/callback")) return null;

  const dest = request.nextUrl.clone();
  dest.protocol = "https:";
  dest.hostname = branchHost;
  dest.port = "";
  return NextResponse.redirect(dest, 307);
}

/** Si Supabase devuelve `?code=` fuera de /auth/callback, reenviar al canje PKCE. */
function redirectOAuthCodeIfNeeded(request: NextRequest): NextResponse | null {
  const { pathname, searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  if (!code || pathname.startsWith("/auth/callback")) return null;

  const url = request.nextUrl.clone();
  url.pathname = "/auth/callback";
  if (!url.searchParams.has("next")) {
    url.searchParams.set("next", pathname === "/" ? "/cuenta" : pathname);
  }
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  const branchRedirect = redirectPreviewToStableBranch(request);
  if (branchRedirect) return branchRedirect;

  const oauthRedirect = redirectOAuthCodeIfNeeded(request);
  if (oauthRedirect) return oauthRedirect;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protección de /admin por rol real (defensa de primer nivel).
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // 1) Sin sesión → enviar a /login para autenticarse.
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("login", "required");
      return NextResponse.redirect(url);
    }

    // 2) Autenticado pero sin role='admin' → acceso denegado.
    const admin = await isAdminUser(supabase, user.id);
    if (!admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("admin", "denied");
      return NextResponse.redirect(url);
    }

    // 3) role='admin' → continuar.
  }

  return supabaseResponse;
}
