/**
 * B5 — Import de los 39 productos del mock (src/lib/products.ts) a Supabase.
 *
 * SEGURO POR DEFECTO: sin flags hace DRY-RUN (no escribe nada, solo muestra
 * el plan). Para escribir realmente en la base, pasar --commit.
 *
 * Uso:
 *   npx tsx scripts/import-catalog-from-mock.ts            # dry-run (preview)
 *   npx tsx scripts/import-catalog-from-mock.ts --commit   # ejecuta el import
 *   npx tsx scripts/import-catalog-from-mock.ts --verify   # solo validaciones
 *
 * Credenciales: lee .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 * Usa la service role key (bypassa RLS) — solo para este script administrativo.
 *
 * Idempotente: re-ejecutar no duplica (upsert por slug / claves naturales;
 * el inventario existente NO se sobrescribe).
 *
 * No inventa stock (quantity = 0) ni specs (no inserta product_specs).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PRODUCTS } from "../src/lib/products";
import { slugify } from "../src/lib/catalog/format";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const COMMIT = process.argv.includes("--commit");
const VERIFY_ONLY = process.argv.includes("--verify");

// Categorías del mock → slug (alineado a seeds de migraciones).
const CATEGORY_SLUG: Record<string, string> = {
  Instrumentos: "instrumentos",
  Accesorios: "accesorios",
  "Equipos de Audio": "equipos-de-audio",
};

const BRANCH_SLUGS = ["chalco", "amecameca"] as const;

function loadEnvLocal(): void {
  try {
    const content = readFileSync(join(ROOT, ".env.local"), "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // sin .env.local: se usarán variables del entorno si existen
  }
}

function getClient(): SupabaseClient {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (.env.local o entorno).",
    );
    process.exit(1);
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Construye el plan de import a partir del mock (sin tocar la red). */
function buildPlan() {
  const usedSlugs = new Set<string>();

  const products = PRODUCTS.map((p) => {
    let slug = slugify(`${p.brand} ${p.name}`);
    let candidate = slug;
    let i = 2;
    while (usedSlugs.has(candidate)) {
      candidate = `${slug}-${i++}`;
    }
    slug = candidate;
    usedSlugs.add(slug);

    return {
      mockId: p.id,
      slug,
      title: p.name,
      sku: p.id, // identificador estable del mock; editable luego en admin
      price: p.price,
      isNew: Boolean(p.isNew),
      brandName: p.brand,
      brandSlug: slugify(p.brand),
      categoryName: p.category,
      categorySlug: CATEGORY_SLUG[p.category],
      subcategoryName: p.subcategory,
      subcategorySlug: slugify(p.subcategory),
      image: p.image,
    };
  });

  const brands = [...new Map(products.map((p) => [p.brandSlug, p.brandName])).entries()].map(
    ([slug, name]) => ({ slug, name }),
  );

  const subcategories = [
    ...new Map(
      products.map((p) => [
        p.subcategorySlug,
        { slug: p.subcategorySlug, name: p.subcategoryName, categorySlug: p.categorySlug },
      ]),
    ).values(),
  ];

  return { products, brands, subcategories };
}

type Plan = ReturnType<typeof buildPlan>;

async function commitImport(supabase: SupabaseClient, plan: Plan) {
  // 1) Marcas (crear/usar) — upsert por slug.
  console.log(`Upsert ${plan.brands.length} marcas...`);
  const { error: brandErr } = await supabase
    .from("brands")
    .upsert(plan.brands, { onConflict: "slug" });
  if (brandErr) throw new Error(`brands: ${brandErr.message}`);

  // 2) Categorías necesarias (deberían existir por seed; crear si faltan).
  const neededCats = [...new Set(plan.products.map((p) => p.categorySlug))];
  for (const slug of neededCats) {
    const name = plan.products.find((p) => p.categorySlug === slug)!.categoryName;
    const { error } = await supabase
      .from("categories")
      .upsert({ name, slug }, { onConflict: "slug" });
    if (error) throw new Error(`categories: ${error.message}`);
  }

  // Map categoría slug → id.
  const { data: catRows, error: catErr } = await supabase
    .from("categories")
    .select("id, slug");
  if (catErr) throw new Error(`categories fetch: ${catErr.message}`);
  const catIdBySlug = new Map((catRows ?? []).map((c) => [c.slug, c.id]));

  // 3) Subcategorías (crear/usar) — upsert por slug con su category_id.
  console.log(`Upsert ${plan.subcategories.length} subcategorías...`);
  const subRows = plan.subcategories.map((s) => ({
    name: s.name,
    slug: s.slug,
    category_id: catIdBySlug.get(s.categorySlug) ?? null,
  }));
  const { error: subErr } = await supabase
    .from("subcategories")
    .upsert(subRows, { onConflict: "slug" });
  if (subErr) throw new Error(`subcategories: ${subErr.message}`);

  // Maps de ids.
  const { data: brandRows } = await supabase.from("brands").select("id, slug");
  const brandIdBySlug = new Map((brandRows ?? []).map((b) => [b.slug, b.id]));

  const { data: subAllRows } = await supabase.from("subcategories").select("id, slug");
  const subIdBySlug = new Map((subAllRows ?? []).map((s) => [s.slug, s.id]));

  const { data: branchRows, error: brErr } = await supabase
    .from("branches")
    .select("id, slug");
  if (brErr) throw new Error(`branches fetch: ${brErr.message}`);
  const branchIdBySlug = new Map((branchRows ?? []).map((b) => [b.slug, b.id]));
  for (const bs of BRANCH_SLUGS) {
    if (!branchIdBySlug.has(bs)) {
      throw new Error(`Falta la sucursal '${bs}' (¿aplicaste el seed de B1?).`);
    }
  }

  // 4) Productos — upsert por slug, is_published = true.
  console.log(`Upsert ${plan.products.length} productos...`);
  const productRows = plan.products.map((p) => ({
    title: p.title,
    slug: p.slug,
    sku: p.sku,
    price: p.price,
    is_new: p.isNew,
    is_published: true,
    brand_id: brandIdBySlug.get(p.brandSlug) ?? null,
    category_id: catIdBySlug.get(p.categorySlug) ?? null,
    subcategory_id: subIdBySlug.get(p.subcategorySlug) ?? null,
  }));
  const { data: upserted, error: prodErr } = await supabase
    .from("products")
    .upsert(productRows, { onConflict: "slug" })
    .select("id, slug");
  if (prodErr) throw new Error(`products: ${prodErr.message}`);
  const productIdBySlug = new Map((upserted ?? []).map((p) => [p.slug, p.id]));

  // 5) Imagen principal — insertar solo si el producto aún no tiene imágenes.
  const allIds = [...productIdBySlug.values()];
  const { data: existingImgs } = await supabase
    .from("product_images")
    .select("product_id")
    .in("product_id", allIds);
  const haveImg = new Set((existingImgs ?? []).map((r) => r.product_id));

  const imageRows = plan.products
    .map((p) => {
      const pid = productIdBySlug.get(p.slug);
      if (!pid || haveImg.has(pid)) return null;
      return { product_id: pid, url: p.image, alt_text: p.title, sort_order: 0 };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (imageRows.length) {
    console.log(`Insert ${imageRows.length} imágenes principales...`);
    const { error } = await supabase.from("product_images").insert(imageRows);
    if (error) throw new Error(`product_images: ${error.message}`);
  } else {
    console.log("Imágenes: todos los productos ya tenían imagen (sin cambios).");
  }

  // 6) Inventario por sucursal — quantity = 0; NO sobrescribe existentes.
  console.log("Upsert inventario (quantity=0, ignora existentes)...");
  const invRows = allIds.flatMap((pid) =>
    BRANCH_SLUGS.map((bs) => ({
      product_id: pid,
      branch_id: branchIdBySlug.get(bs)!,
      quantity: 0,
    })),
  );
  const { error: invErr } = await supabase
    .from("product_inventory")
    .upsert(invRows, { onConflict: "product_id,branch_id", ignoreDuplicates: true });
  if (invErr) throw new Error(`product_inventory: ${invErr.message}`);

  console.log("Import completado.\n");
}

async function validate(supabase: SupabaseClient, plan: Plan) {
  const results: { label: string; pass: boolean; detail?: string }[] = [];
  const add = (label: string, pass: boolean, detail?: string) =>
    results.push({ label, pass, detail });

  const expected = plan.products.length;

  // a) 39 productos publicados.
  const { count: pubCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true);
  add(`${expected} productos publicados`, pubCount === expected, `encontrados: ${pubCount ?? 0}`);

  // Ids de los productos del plan (por slug).
  const slugs = plan.products.map((p) => p.slug);
  const { data: prodRows } = await supabase
    .from("products")
    .select("id, slug")
    .in("slug", slugs);
  const ids = (prodRows ?? []).map((r) => r.id);

  // b) Slugs únicos (los del plan se encontraron 1:1).
  const distinctSlugs = new Set((prodRows ?? []).map((r) => r.slug));
  add(
    "slugs únicos y presentes",
    distinctSlugs.size === expected && (prodRows ?? []).length === expected,
    `slugs: ${distinctSlugs.size}/${expected}`,
  );

  // c) Cada producto con >= 1 imagen.
  const { data: imgRows } = await supabase
    .from("product_images")
    .select("product_id")
    .in("product_id", ids);
  const withImg = new Set((imgRows ?? []).map((r) => r.product_id));
  add("todos con >=1 imagen", withImg.size === ids.length, `con imagen: ${withImg.size}/${ids.length}`);

  // d) Inventario para ambas sucursales.
  const { data: invRows } = await supabase
    .from("product_inventory")
    .select("product_id, branch_id")
    .in("product_id", ids);
  const branchCount = new Map<string, Set<string>>();
  for (const r of invRows ?? []) {
    const set = branchCount.get(r.product_id) ?? new Set<string>();
    set.add(r.branch_id);
    branchCount.set(r.product_id, set);
  }
  const bothBranches = ids.filter((id) => (branchCount.get(id)?.size ?? 0) >= 2).length;
  add(
    "inventario en ambas sucursales",
    bothBranches === ids.length,
    `con 2 sucursales: ${bothBranches}/${ids.length}`,
  );

  console.log("\n=== Validación B5 ===\n");
  let allPass = true;
  for (const r of results) {
    if (!r.pass) allPass = false;
    console.log(`[${r.pass ? "PASS" : "FAIL"}] ${r.label}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\n${allPass ? "TODO OK — import válido." : "HAY FALLOS — revisar arriba."}\n`);
  return allPass;
}

async function main() {
  const plan = buildPlan();

  console.log(`\nProductos en mock: ${plan.products.length}`);
  console.log(`Marcas únicas: ${plan.brands.length}`);
  console.log(`Subcategorías únicas: ${plan.subcategories.length}\n`);

  if (!COMMIT && !VERIFY_ONLY) {
    console.log("DRY-RUN (no se escribe nada). Ejemplos de productos a importar:\n");
    for (const p of plan.products.slice(0, 5)) {
      console.log(
        `  · ${p.slug}  [sku=${p.sku}]  ${p.brandSlug}/${p.subcategorySlug}  $${p.price}  ${p.isNew ? "NUEVO" : ""}`,
      );
    }
    console.log(`  ... (${plan.products.length} en total)\n`);
    console.log("Para ejecutar el import real: --commit");
    console.log("Para validar lo ya importado: --verify\n");
    return;
  }

  const supabase = getClient();

  if (COMMIT) {
    await commitImport(supabase, plan);
  }

  const ok = await validate(supabase, plan);
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error("\nERROR:", e instanceof Error ? e.message : e);
  process.exit(1);
});
