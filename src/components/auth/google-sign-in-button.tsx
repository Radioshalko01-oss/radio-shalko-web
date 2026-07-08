"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  AUTH_NEXT_COOKIE,
  AUTH_ORIGIN_COOKIE,
  isLanIpOrigin,
  isPrivateOrLocalOrigin,
  oauthCallbackRedirectUrl,
  safeAuthNextPath,
} from "@/lib/site/site-url";
import { cn } from "@/lib/utils";

type GoogleSignInButtonProps = {
  next?: string;
  className?: string;
  buttonClassName?: string;
};

function setAuthCookies(next: string, origin: string) {
  const safeNext = safeAuthNextPath(next);
  const secure = origin.startsWith("https://") ? "; Secure" : "";
  document.cookie = `${AUTH_NEXT_COOKIE}=; Path=/; Max-Age=0`;
  document.cookie = `${AUTH_ORIGIN_COOKIE}=; Path=/; Max-Age=0`;
  document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent(safeNext)}; Path=/; Max-Age=600; SameSite=Lax${secure}`;
  document.cookie = `${AUTH_ORIGIN_COOKIE}=${encodeURIComponent(origin)}; Path=/; Max-Age=600; SameSite=Lax${secure}`;
}

/**
 * localhost: OAuth en cliente. LAN IP: requiere túnel. Producción: /auth/google.
 */
export function GoogleSignInButton({
  next = "/cuenta",
  className,
  buttonClassName,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setLoading(true);
    setError(null);

    const origin = window.location.origin;
    const safeNext = safeAuthNextPath(next);
    setAuthCookies(safeNext, origin);

    if (isLanIpOrigin(origin)) {
      const tunnel = process.env.NEXT_PUBLIC_OAUTH_PUBLIC_ORIGIN?.trim().replace(/\/+$/, "");
      if (tunnel) {
        const login = new URL("/login", tunnel);
        login.searchParams.set("next", safeNext);
        window.location.assign(login.toString());
        return;
      }

      setError(
        "Login con Google no funciona por IP local (192.168.x.x). En Mac usa localhost:3002/login; en iPhone ejecuta npm run tunnel:oauth en la Mac.",
      );
      setLoading(false);
      return;
    }

    if (isPrivateOrLocalOrigin(origin)) {
      const supabase = createClient();
      const redirectTo = oauthCallbackRedirectUrl(origin);
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            prompt: "select_account",
          },
        },
      });
      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
      return;
    }

    const params = new URLSearchParams({
      next: safeNext,
      origin,
    });
    window.location.assign(`/auth/google?${params.toString()}`);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={signIn}
        disabled={loading}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-800 transition-colors duration-150 hover:bg-zinc-50 disabled:opacity-60 motion-reduce:transition-none",
          buttonClassName,
        )}
      >
        <GoogleIcon />
        {loading ? "Conectando…" : "Continuar con Google"}
      </button>
      {error && <p className="mt-2.5 text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
