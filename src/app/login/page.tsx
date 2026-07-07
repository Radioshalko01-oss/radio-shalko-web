import type { Metadata } from "next";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { LoginEnter, LoginFooterLink } from "@/components/auth/login-enter";
import { OAuthLanNotice } from "@/components/auth/oauth-lan-notice";
import { SiteLogo } from "@/components/brand/site-logo";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  robots: { index: false, follow: false },
};

const MESSAGES: Record<string, { tone: "info" | "error"; text: string }> = {
  required: {
    tone: "info",
    text: "Inicia sesión para acceder al panel de administración.",
  },
  denied: {
    tone: "error",
    text: "Tu cuenta no tiene permisos de administrador.",
  },
  auth: {
    tone: "error",
    text: "No se pudo completar el inicio de sesión. Intenta de nuevo.",
  },
};

type SearchParams = Promise<{
  login?: string;
  admin?: string;
  error?: string;
  detail?: string;
  next?: string;
}>;

function safeNextPath(next: string | undefined): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/cuenta";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const key =
    sp.admin === "denied"
      ? "denied"
      : sp.login === "required"
        ? "required"
        : sp.error === "auth"
          ? "auth"
          : null;
  const message = key ? MESSAGES[key] : null;
  const detail = key === "auth" && sp.detail ? sp.detail : null;
  const next = safeNextPath(sp.next);

  return (
    <main className="flex flex-1 flex-col md:min-h-[calc(100dvh-5rem)] md:items-center md:justify-center md:px-4">
      <LoginEnter>
        <div className="flex w-full flex-col max-md:min-h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] max-md:justify-between max-md:bg-background md:justify-center">
          <div className="flex flex-1 flex-col justify-center bg-background px-6 py-10 md:rounded-2xl md:border md:border-border md:bg-card md:px-7 md:py-8 md:shadow-sm sm:px-8 sm:py-9">
            <div className="text-center">
              <SiteLogo variant="horizontal" context="login" size="md" className="mx-auto" />
              <h1 className="mt-6 font-display text-[1.35rem] font-semibold tracking-tight text-foreground">
                Inicia sesión
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Accede con Google para guardar favoritos, sincronizar tu carrito y dar seguimiento
                a tus solicitudes.
              </p>
            </div>

            {message && (
              <div
                className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
                  message.tone === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-border bg-muted/40 text-muted-foreground"
                }`}
              >
                {message.text}
                {detail && (
                  <p className="mt-1.5 break-words font-mono text-xs text-red-500/80">{detail}</p>
                )}
              </div>
            )}

            <div className="mt-6">
              <GoogleSignInButton
                next={next}
                buttonClassName="h-12 rounded-full border-border shadow-sm"
              />
              <OAuthLanNotice />
            </div>
          </div>

          <LoginFooterLink>
            <Link
              href="/"
              className="text-sm text-muted-foreground underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline motion-reduce:transition-none"
            >
              Volver a la tienda
            </Link>
          </LoginFooterLink>
        </div>
      </LoginEnter>
    </main>
  );
}
