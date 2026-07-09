#!/usr/bin/env node
/**
 * Aplica la migración de campos de detalle de producto en Supabase.
 * Requiere SUPABASE_DB_PASSWORD en .env.local (contraseña de postgres del proyecto).
 *
 * Uso: node scripts/apply-product-detail-migration.mjs
 *
 * Alternativa manual (SQL Editor en Supabase Dashboard):
 *   alter table products
 *     add column if not exists specifications text,
 *     add column if not exists features text,
 *     add column if not exists includes text;
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  try {
    const raw = readFileSync(resolve(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const password = process.env.SUPABASE_DB_PASSWORD;

if (!url || !password) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_DB_PASSWORD en .env.local.\n" +
      "O ejecuta el SQL manualmente en Supabase → SQL Editor:\n\n" +
      readFileSync(
        resolve(root, "supabase/migrations/20260704000000_product_detail_sections.sql"),
        "utf8",
      ),
  );
  process.exit(1);
}

const ref = url.replace("https://", "").split(".")[0];
const connectionString = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

const sql = readFileSync(
  resolve(root, "supabase/migrations/20260704000000_product_detail_sections.sql"),
  "utf8",
);

const { Client } = await import("pg");
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log("Migración aplicada: specifications, features, includes.");
} catch (err) {
  console.error("Error al aplicar migración:", err.message);
  console.error("\nPrueba el SQL manual en Supabase Dashboard o verifica SUPABASE_DB_PASSWORD.");
  process.exit(1);
} finally {
  await client.end();
}
