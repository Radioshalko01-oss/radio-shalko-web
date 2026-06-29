import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/auth/is-admin";

/**
 * Identidad mínima de la sesión actual para la UI (header, /cuenta).
 *
 * NO es un mecanismo de seguridad: solo decide qué mostrar. La protección
 * real de /admin vive en middleware + requireAdmin() + RLS + Server Actions.
 */
export type Account = {
  email: string | null;
  isAdmin: boolean;
};

/** Devuelve la cuenta actual o null si no hay sesión. */
export async function getCurrentAccount(): Promise<Account | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const isAdmin = await isAdminUser(supabase, user.id);
  return { email: user.email ?? null, isAdmin };
}
