/**
 * Vacía el catálogo de productos para empezar con datos reales.
 *
 * Uso:
 *   npx tsx scripts/purge-all-products.ts                         # preview
 *   npx tsx scripts/purge-all-products.ts --commit                # borra productos
 *   npx tsx scripts/purge-all-products.ts --commit --include-orders  # también pedidos de prueba
 *
 * Credenciales: .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 *
 * Borra en cascada: imágenes, specs, inventario, favoritos, related_products.
 * Limpia antes: carritos compartidos, ítems de cotización.
 * Pedidos: product_id tiene RESTRICT — usa --include-orders para eliminar pedidos de prueba.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COMMIT = process.argv.includes("--commit");
const INCLUDE_ORDERS = process.argv.includes("--include-orders");

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
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (.env.local).",
    );
    process.exit(1);
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function count(supabase: SupabaseClient, table: string): Promise<number> {
  const { count: n, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  return n ?? 0;
}

async function purgeAllProducts(supabase: SupabaseClient) {
  const [products, orderItems, orders, quoteItems, sharedItems, favorites] =
    await Promise.all([
      count(supabase, "products"),
      count(supabase, "order_items"),
      count(supabase, "orders"),
      count(supabase, "quote_items"),
      count(supabase, "shared_cart_items"),
      count(supabase, "favorites"),
    ]);

  console.log("Estado actual:");
  console.log(`  productos:           ${products}`);
  console.log(`  pedidos:             ${orders} (${orderItems} líneas)`);
  console.log(`  cotizaciones (ítems): ${quoteItems}`);
  console.log(`  carritos compartidos: ${sharedItems}`);
  console.log(`  favoritos:           ${favorites}`);

  if (products === 0) {
    console.log("\nNo hay productos que borrar.");
    return;
  }

  if (orderItems > 0 && !INCLUDE_ORDERS) {
    console.log(
      "\n⚠ Hay pedidos que referencian productos. No se pueden borrar productos sin --include-orders.",
    );
    console.log("  Si son pedidos de prueba, vuelve a ejecutar con: --commit --include-orders");
    if (COMMIT) process.exit(1);
    return;
  }

  if (!COMMIT) {
    console.log("\nDry-run. Para borrar, agrega --commit");
    if (orderItems > 0) console.log("  (y --include-orders si quieres eliminar pedidos de prueba)");
    return;
  }

  console.log("\nEliminando…");

  if (INCLUDE_ORDERS && orders > 0) {
    const { error } = await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(`orders: ${error.message}`);
    console.log(`  ✓ ${orders} pedido(s) eliminado(s)`);
  }

  if (sharedItems > 0) {
    const { error: itemsErr } = await supabase
      .from("shared_cart_items")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (itemsErr) throw new Error(`shared_cart_items: ${itemsErr.message}`);
    const { error: cartsErr } = await supabase
      .from("shared_carts")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (cartsErr) throw new Error(`shared_carts: ${cartsErr.message}`);
    console.log(`  ✓ carritos compartidos limpiados`);
  }

  if (quoteItems > 0) {
    const { error } = await supabase
      .from("quote_items")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(`quote_items: ${error.message}`);
    console.log(`  ✓ ${quoteItems} ítem(s) de cotización eliminado(s)`);
  }

  const { data: productRows, error: fetchErr } = await supabase
    .from("products")
    .select("id, title");
  if (fetchErr) throw new Error(`products fetch: ${fetchErr.message}`);

  const ids = (productRows ?? []).map((p) => p.id);
  if (ids.length === 0) {
    console.log("  (sin productos)");
    return;
  }

  const { error: delErr } = await supabase.from("products").delete().in("id", ids);
  if (delErr) throw new Error(`products delete: ${delErr.message}`);

  console.log(`  ✓ ${ids.length} producto(s) eliminado(s)`);

  // Storage best-effort
  try {
    const bucket = "product-images";
    const paths: string[] = [];
    for (const id of ids) {
      for (const prefix of [`${id}`, `${id}/gallery`]) {
        const { data: files } = await supabase.storage.from(bucket).list(prefix);
        for (const f of files ?? []) {
          if (f.name) paths.push(`${prefix}/${f.name}`);
        }
      }
    }
    if (paths.length) {
      await supabase.storage.from(bucket).remove(paths);
      console.log(`  ✓ ${paths.length} archivo(s) de Storage eliminado(s)`);
    }
  } catch {
    console.log("  (Storage: limpieza parcial omitida)");
  }

  console.log("\n✓ Catálogo vacío. Puedes subir productos reales desde /admin/productos/nuevo");
}

purgeAllProducts(getClient()).catch((err) => {
  console.error(err);
  process.exit(1);
});
