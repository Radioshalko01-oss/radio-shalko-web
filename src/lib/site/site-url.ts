/**
 * URL pública del sitio (auth, Stripe, emails).
 *
 * Prioridad en Vercel Preview: cada deployment tiene su propia VERCEL_URL.
 * OAuth en el navegador usa `location.origin` vía oauthCallbackUrl().
 */
export function siteBaseUrl(): string {
  const vercelEnv = process.env.VERCEL_ENV;
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelEnv === "preview" && vercelUrl) {
    return `https://${vercelUrl.replace(/\/+$/, "")}`;
  }

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  return "http://localhost:3002";
}

/** Ruta de callback OAuth (PKCE) con destino post-login. */
export function oauthCallbackUrl(next: string, origin?: string): string {
  const base = (origin ?? siteBaseUrl()).replace(/\/+$/, "");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/cuenta";
  return `${base}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
