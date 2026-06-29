#!/usr/bin/env node
/**
 * Verifica que la migración 20260522000000_favorites_quotes_audit.sql
 * se haya aplicado correctamente al proyecto remoto de Radio Shalko.
 *
 * Uso: SUPABASE_ACCESS_TOKEN=sbp_... node scripts/verify-fase2.mjs
 *
 * Comprueba:
 *   1. Tablas: quotes, quote_items, admin_audit_log
 *   2. Índice: favorites_product_id_idx
 *   3. Trigger: profiles_prevent_escalation (en public.profiles)
 *   4. Función: prevent_profile_privilege_escalation
 *   5. Policy: profiles_update_own reforzada (using + with check)
 */

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? "actxvfjtejmpkjernvtw";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!TOKEN) {
  console.error("Falta SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}

async function q(query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return text ? JSON.parse(text) : [];
}

const results = [];
const check = (label, pass, detail = "") =>
  results.push({ label, pass, detail });

try {
  // 1. Tablas nuevas
  const tables = await q(`
    select table_name from information_schema.tables
    where table_schema = 'public'
      and table_name in ('quotes','quote_items','admin_audit_log')
    order by table_name;
  `);
  const tableNames = tables.map((r) => r.table_name);
  for (const t of ["admin_audit_log", "quote_items", "quotes"]) {
    check(`tabla ${t}`, tableNames.includes(t));
  }

  // 2. Índice favorites_product_id_idx
  const idx = await q(`
    select indexname from pg_indexes
    where schemaname = 'public' and indexname = 'favorites_product_id_idx';
  `);
  check("índice favorites_product_id_idx", idx.length === 1);

  // 3. Trigger profiles_prevent_escalation
  const trg = await q(`
    select tgname from pg_trigger
    where tgrelid = 'public.profiles'::regclass
      and tgname = 'profiles_prevent_escalation';
  `);
  check("trigger profiles_prevent_escalation", trg.length === 1);

  // 4. Función prevent_profile_privilege_escalation
  const fn = await q(`
    select proname from pg_proc
    where proname = 'prevent_profile_privilege_escalation';
  `);
  check("función prevent_profile_privilege_escalation", fn.length === 1);

  // 5. Policy profiles_update_own reforzada (using + with check)
  const pol = await q(`
    select polname,
           pg_get_expr(polqual, polrelid) as using_expr,
           pg_get_expr(polwithcheck, polrelid) as check_expr
    from pg_policy
    where polrelid = 'public.profiles'::regclass
      and polname = 'profiles_update_own';
  `);
  const usingExpr = (pol[0]?.using_expr ?? "").toLowerCase();
  const checkExpr = (pol[0]?.check_expr ?? "").toLowerCase();
  check(
    "policy profiles_update_own (using + with check)",
    pol.length === 1 && usingExpr.includes("auth.uid()") && checkExpr.includes("auth.uid()"),
    pol.length ? `using=${usingExpr} check=${checkExpr || "—"}` : "policy no encontrada",
  );
} catch (e) {
  console.error("\nERROR ejecutando verificación:", e.message);
  process.exit(1);
}

// Reporte
let allPass = true;
console.log("\n=== Verificación Fase 2 (favorites/quotes/audit/role) ===\n");
for (const r of results) {
  const mark = r.pass ? "PASS" : "FAIL";
  if (!r.pass) allPass = false;
  console.log(`[${mark}] ${r.label}${r.detail ? ` — ${r.detail}` : ""}`);
}
console.log(
  `\n${allPass ? "TODO OK — migración Fase 2 aplicada correctamente." : "HAY FALLOS — revisar arriba."}\n`,
);
process.exit(allPass ? 0 : 1);
