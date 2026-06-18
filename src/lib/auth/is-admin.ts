import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.generated";

/**
 * Verificación centralizada de rol admin.
 *
 * Función PURA y agnóstica de contexto: recibe un SupabaseClient ya
 * construido en el entorno correcto (middleware/edge, Server Component
 * o Server Action) y consulta `profiles.role`.
 *
 * No importa `next/headers` ni clientes concretos para poder usarse
 * tanto en el middleware (edge) como en el servidor (node).
 *
 * La RLS de `profiles` permite a cada usuario leer su propia fila
 * (policy `profiles_select_own`), por lo que esta consulta funciona
 * con la sesión del propio usuario.
 */
export async function isAdminUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) return false;
  return data.role === "admin";
}
