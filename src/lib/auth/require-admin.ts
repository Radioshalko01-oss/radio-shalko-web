import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/auth/is-admin";

/**
 * Utilidad server-side reutilizable (Server Components, layouts y Server Actions).
 *
 * Defensa en profundidad: NO confía solo en el middleware. Cada superficie
 * de administración debe llamar a `requireAdmin()` para garantizar que la
 * sesión exista y tenga `role='admin'` en el momento del request/acción.
 *
 * Comportamiento (redirect, apto para RSC/layouts y también Server Actions):
 *   - sin sesión        → redirect "/login?login=required"
 *   - sesión sin admin  → redirect "/login?admin=denied"
 *   - admin             → devuelve el usuario
 */
export async function requireAdmin(): Promise<User> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?login=required");
  }

  const admin = await isAdminUser(supabase, user.id);
  if (!admin) {
    redirect("/login?admin=denied");
  }

  return user;
}

/**
 * Variante sin redirect para lógica condicional (ej. mostrar/ocultar UI
 * o validar dentro de una Server Action que prefiere lanzar un error).
 * Devuelve el usuario admin o `null`.
 */
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = await isAdminUser(supabase, user.id);
  return admin ? user : null;
}
