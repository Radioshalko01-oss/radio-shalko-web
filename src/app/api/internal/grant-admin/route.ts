import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAIL = "radioshalkoadministrador@gmail.com";

/**
 * Otorga rol admin a la cuenta operativa (una vez aplicada la migración grant_admin_role_rpc).
 * Protegido con CRON_SECRET — solo para bootstrap operativo.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("grant_admin_role", { p_email: ADMIN_EMAIL });

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        hint: "Aplica primero supabase/migrations/20260708210000_grant_admin_role_rpc.sql en el SQL Editor de Supabase.",
      },
      { status: 500 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role")
    .ilike("email", ADMIN_EMAIL)
    .maybeSingle();

  return NextResponse.json({ ok: true, profile });
}
