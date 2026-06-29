import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Callback OAuth (PKCE). Canjea el `code` por sesión y redirige a `next`.
 *
 * Diagnóstico: en cualquier fallo se loggea el error REAL en el servidor y se
 * redirige a /login?error=auth con un `detail` legible (sin secretos), para
 * poder distinguir entre: error del proveedor, code ausente o canje fallido.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Errores devueltos por el proveedor / Supabase (provider deshabilitado,
  // redirect no autorizado, consentimiento cancelado, etc.).
  const providerError = searchParams.get("error");
  const providerErrorDescription =
    searchParams.get("error_description") ?? searchParams.get("error_code");

  const fail = (detail: string) => {
    const url = new URL(`${origin}/login`);
    url.searchParams.set("error", "auth");
    url.searchParams.set("detail", detail);
    return NextResponse.redirect(url);
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

  return NextResponse.redirect(`${origin}${next}`);
}
