/**
 * URL pública del sitio (auth, Stripe, emails).
 *
 * OAuth en el navegador debe usar `window.location.origin` (mismo origen).
 * El destino post-login (`next`) va en cookie — no en redirectTo — para que
 * Supabase uri_allow_list coincida con `/auth/callback` sin query string.
 */
export function siteBaseUrl(): string {
  const vercelEnv = process.env.VERCEL_ENV;

  // Preview estable por rama (ej. …-git-public-redesign-local-….vercel.app).
  // VERCEL_URL apunta al deployment único; las cookies no cruzan entre subdominios.
  const branchUrl = process.env.VERCEL_BRANCH_URL?.trim();
  if (vercelEnv === "preview" && branchUrl) {
    return `https://${branchUrl.replace(/\/+$/, "")}`;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();

  if ((vercelEnv === "preview" || vercelEnv === "production") && vercelUrl) {
    return `https://${vercelUrl.replace(/\/+$/, "")}`;
  }

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  return "http://localhost:3002";
}

/** Base URL para success/cancel de Stripe: mismo origen que el request actual. */
export function stripeReturnBaseUrl(headers: Headers): string {
  return requestSiteOrigin(headers);
}

/** Ruta interna segura para redirigir tras login. */
export function safeAuthNextPath(next: string | undefined, fallback = "/cuenta"): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return fallback;
}

/** Origin del request (Server Actions / Route Handlers). */
export function requestSiteOrigin(headers: Headers): string {
  const origin = headers.get("origin")?.trim();
  if (origin) return origin.replace(/\/+$/, "");

  const forwardedHost = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const proto = forwardedProto || (forwardedHost.startsWith("localhost") ? "http" : "https");
    return `${proto}://${forwardedHost}`.replace(/\/+$/, "");
  }

  const host = headers.get("host")?.trim();
  if (host) {
    const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    return `${proto}://${host}`.replace(/\/+$/, "");
  }

  return siteBaseUrl();
}

/**
 * URL de callback OAuth registrada en Supabase.
 * Sin query params — deben coincidir con uri_allow_list (ej. …/auth/callback).
 */
export function oauthCallbackRedirectUrl(origin?: string): string {
  const base = (origin ?? siteBaseUrl()).replace(/\/+$/, "");
  return `${base}/auth/callback`;
}

/** @deprecated Usar oauthCallbackRedirectUrl + cookie rs_auth_next. */
export function oauthCallbackUrl(next: string, origin?: string): string {
  const base = oauthCallbackRedirectUrl(origin);
  const safeNext = safeAuthNextPath(next);
  return `${base}?next=${encodeURIComponent(safeNext)}`;
}

export const AUTH_NEXT_COOKIE = "rs_auth_next";
