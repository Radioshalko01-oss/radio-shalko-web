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

/** localhost, 127.0.0.1 o IP privada (LAN) — siempre http en dev. */
export function isPrivateOrLocalHost(host: string): boolean {
  const hostname = host.split(":")[0]?.replace(/^\[|\]$/g, "").toLowerCase() ?? "";
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return true;
  }
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  return false;
}

/** Origen http en localhost o LAN (pruebas en iPhone / red local). */
export function isPrivateOrLocalOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:") return false;
    const host = url.port ? `${url.hostname}:${url.port}` : url.hostname;
    return isPrivateOrLocalHost(host);
  } catch {
    return false;
  }
}

/** IP LAN (192.168.x.x, etc.) — Supabase OAuth las rechaza; localhost no cuenta. */
export function isLanIpOrigin(origin: string): boolean {
  if (!isPrivateOrLocalOrigin(origin)) return false;
  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    return hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "::1";
  } catch {
    return false;
  }
}

/** Origin OAuth: query/cookie del cliente primero, luego headers. */
export function resolveOAuthOrigin(
  headers: Headers,
  originParam?: string | null,
  originCookie?: string | null,
): string {
  for (const candidate of [originParam?.trim(), originCookie?.trim()]) {
    if (!candidate) continue;
    try {
      const normalized = new URL(candidate).origin.replace(/\/+$/, "");
      if (isPrivateOrLocalOrigin(normalized)) return normalized;
      if (normalized.startsWith("https://")) return normalized;
    } catch {
      // URL inválida
    }
  }
  return requestSiteOrigin(headers);
}

function resolveRequestProto(headers: Headers, host: string): "http" | "https" {
  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedProto === "http" || forwardedProto === "https") {
    return forwardedProto;
  }
  return isPrivateOrLocalHost(host) ? "http" : "https";
}

/** Origin del request (Server Actions / Route Handlers). */
export function requestSiteOrigin(headers: Headers): string {
  const origin = headers.get("origin")?.trim();
  if (origin) return origin.replace(/\/+$/, "");

  const forwardedHost = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const proto = resolveRequestProto(headers, forwardedHost);
    return `${proto}://${forwardedHost}`.replace(/\/+$/, "");
  }

  const host = headers.get("host")?.trim();
  if (host) {
    const proto = resolveRequestProto(headers, host);
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
export const AUTH_ORIGIN_COOKIE = "rs_auth_origin";
