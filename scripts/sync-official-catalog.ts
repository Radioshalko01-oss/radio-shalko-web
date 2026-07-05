/**
 * Sincroniza marcas y subcategorías oficiales (catalog-taxonomy) con Supabase.
 *
 * Uso:
 *   npx tsx scripts/sync-official-catalog.ts            # dry-run
 *   npx tsx scripts/sync-official-catalog.ts --commit   # escribe en BD
 *
 * Credenciales: .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "../src/lib/catalog/format";
import {
  OFFICIAL_BRANDS,
  OFFICIAL_CATEGORY_SLUGS,
  getOfficialCatalogTypeSubcategories,
} from "../src/lib/navigation/catalog-taxonomy";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COMMIT = process.argv.includes("--commit");

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
    // sin .env.local
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

async function syncOfficialCatalog(supabase: SupabaseClient) {
  const officialBrandSlugs = new Set(OFFICIAL_BRANDS.map((n) => slugify(n)));
  const officialSubSlugs = new Set(getOfficialCatalogTypeSubcategories().map((s) => s.slug));

  console.log(`Marcas oficiales: ${OFFICIAL_BRANDS.length}`);
  console.log(`Subcategorías oficiales: ${officialSubSlugs.size}`);

  // 1) Categorías raíz
  for (const [name, slug] of Object.entries(OFFICIAL_CATEGORY_SLUGS)) {
    const sortOrder =
      slug === "instrumentos" ? 1 : slug === "accesorios" ? 2 : 3;
    if (COMMIT) {
      const { error } = await supabase
        .from("categories")
        .upsert(
          { name, slug, sort_order: sortOrder, is_active: true },
          { onConflict: "slug" },
        );
      if (error) throw new Error(`categories ${slug}: ${error.message}`);
    } else {
      console.log(`  [cat] ${name} (${slug})`);
    }
  }

  const { data: catRows, error: catErr } = await supabase
    .from("categories")
    .select("id, slug");
  if (catErr) throw new Error(`categories fetch: ${catErr.message}`);
  const catIdBySlug = new Map((catRows ?? []).map((c) => [c.slug, c.id]));

  // 2) Marcas oficiales — upsert + sort_order
  const brandRows = OFFICIAL_BRANDS.map((name, i) => ({
    name,
    slug: slugify(name),
    sort_order: i + 1,
    is_active: true,
  }));

  if (COMMIT) {
    const { error } = await supabase
      .from("brands")
      .upsert(brandRows, { onConflict: "slug" });
    if (error) throw new Error(`brands upsert: ${error.message}`);
  } else {
    for (const b of brandRows) console.log(`  [brand+] ${b.name}`);
  }

  const { data: allBrands, error: brandFetchErr } = await supabase
    .from("brands")
    .select("id, name, slug, is_active");
  if (brandFetchErr) throw new Error(`brands fetch: ${brandFetchErr.message}`);

  const toDeactivateBrands = (allBrands ?? []).filter(
    (b) => !officialBrandSlugs.has(b.slug),
  );
  if (toDeactivateBrands.length) {
    console.log(`Marcas a desactivar: ${toDeactivateBrands.map((b) => b.name).join(", ")}`);
    if (COMMIT) {
      const { error } = await supabase
        .from("brands")
        .update({ is_active: false })
        .in(
          "id",
          toDeactivateBrands.map((b) => b.id),
        );
      if (error) throw new Error(`brands deactivate: ${error.message}`);
    }
  }

  // 3) Subcategorías oficiales
  const subs = getOfficialCatalogTypeSubcategories();
  const subRows = subs.map((s, i) => ({
    name: s.name,
    slug: s.slug,
    category_id: catIdBySlug.get(s.categorySlug) ?? null,
    sort_order: i + 1,
    is_active: true,
  }));

  const missingCat = subRows.filter((s) => !s.category_id);
  if (missingCat.length) {
    throw new Error(
      `Faltan categorías para subcategorías: ${missingCat.map((s) => s.slug).join(", ")}`,
    );
  }

  if (COMMIT) {
    const { error } = await supabase
      .from("subcategories")
      .upsert(subRows, { onConflict: "slug" });
    if (error) throw new Error(`subcategories upsert: ${error.message}`);
  } else {
    for (const s of subs) console.log(`  [sub+] ${s.categoryName} → ${s.name}`);
  }

  const { data: allSubs, error: subFetchErr } = await supabase
    .from("subcategories")
    .select("id, name, slug, is_active");
  if (subFetchErr) throw new Error(`subcategories fetch: ${subFetchErr.message}`);

  const toDeactivateSubs = (allSubs ?? []).filter(
    (s) => !officialSubSlugs.has(s.slug),
  );
  if (toDeactivateSubs.length) {
    console.log(
      `Subcategorías a desactivar: ${toDeactivateSubs.map((s) => s.name).join(", ")}`,
    );
    if (COMMIT) {
      const { error } = await supabase
        .from("subcategories")
        .update({ is_active: false })
        .in(
          "id",
          toDeactivateSubs.map((s) => s.id),
        );
      if (error) throw new Error(`subcategories deactivate: ${error.message}`);
    }
  }

  console.log(COMMIT ? "✓ Catálogo oficial sincronizado." : "Dry-run completo (usa --commit para escribir).");
}

syncOfficialCatalog(getClient()).catch((err) => {
  console.error(err);
  process.exit(1);
});
