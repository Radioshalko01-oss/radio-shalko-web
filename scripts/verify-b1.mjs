#!/usr/bin/env node
/**
 * Verifica que la migración B1 (20260521000000_catalog_extended.sql)
 * se haya aplicado correctamente al proyecto remoto.
 *
 * Uso: SUPABASE_ACCESS_TOKEN=sbp_... node scripts/verify-b1.mjs
 *
 * Comprueba:
 *   1. Tablas: subcategories, branches, product_specs, product_inventory
 *   2. products: subcategory_id, sku, is_new, is_published
 *   3. product_images: alt_text
 *   4. Seeds: branches (chalco, amecameca) + 13 subcategorías
 *   5. RLS activo en las 4 tablas nuevas
 *   6. products_select_public filtra is_published = true OR is_admin()
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
      and table_name in ('subcategories','branches','product_specs','product_inventory')
    order by table_name;
  `);
  const tableNames = tables.map((r) => r.table_name);
  for (const t of ["branches", "product_inventory", "product_specs", "subcategories"]) {
    check(`tabla ${t}`, tableNames.includes(t));
  }

  // 2. Columnas en products
  const prodCols = await q(`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'products'
      and column_name in ('subcategory_id','sku','is_new','is_published');
  `);
  const prodColNames = prodCols.map((r) => r.column_name);
  for (const c of ["subcategory_id", "sku", "is_new", "is_published"]) {
    check(`products.${c}`, prodColNames.includes(c));
  }

  // 3. product_images.alt_text
  const imgCols = await q(`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'product_images'
      and column_name = 'alt_text';
  `);
  check("product_images.alt_text", imgCols.length === 1);

  // 4. Seeds
  const branches = await q(`select slug from public.branches order by slug;`);
  const branchSlugs = branches.map((r) => r.slug);
  check("seed branches: chalco", branchSlugs.includes("chalco"));
  check("seed branches: amecameca", branchSlugs.includes("amecameca"));

  const subCount = await q(`select count(*)::int as n from public.subcategories;`);
  const n = subCount[0]?.n ?? 0;
  check("seed subcategorías = 13", n === 13, `encontradas: ${n}`);

  // 5. RLS activo
  const rls = await q(`
    select relname, relrowsecurity
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relname in ('subcategories','branches','product_specs','product_inventory');
  `);
  for (const t of ["branches", "product_inventory", "product_specs", "subcategories"]) {
    const row = rls.find((r) => r.relname === t);
    check(`RLS activo en ${t}`, row?.relrowsecurity === true);
  }

  // 6. Política products_select_public
  const pol = await q(`
    select polname, pg_get_expr(polqual, polrelid) as using_expr
    from pg_policy
    where polrelid = 'public.products'::regclass
      and polname = 'products_select_public';
  `);
  const expr = (pol[0]?.using_expr ?? "").replace(/\s+/g, " ").toLowerCase();
  const ok =
    expr.includes("is_published") &&
    (expr.includes("is_admin") || expr.includes("is_admin()"));
  check("products_select_public = is_published OR is_admin()", ok, expr || "policy no encontrada");
} catch (e) {
  console.error("\nERROR ejecutando verificación:", e.message);
  process.exit(1);
}

// Reporte
let allPass = true;
console.log("\n=== Verificación B1 ===\n");
for (const r of results) {
  const mark = r.pass ? "PASS" : "FAIL";
  if (!r.pass) allPass = false;
  console.log(`[${mark}] ${r.label}${r.detail ? ` — ${r.detail}` : ""}`);
}
console.log(
  `\n${allPass ? "TODO OK — B1 aplicado correctamente." : "HAY FALLOS — revisar arriba."}\n`,
);
process.exit(allPass ? 0 : 1);
