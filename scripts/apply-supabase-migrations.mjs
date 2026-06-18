#!/usr/bin/env node
/**
 * Aplica migraciones SQL al proyecto remoto vía Management API.
 * Uso: SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-supabase-migrations.mjs
 */
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? "actxvfjtejmpkjernvtw";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!TOKEN) {
  console.error("Falta SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "supabase", "migrations");

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

async function runQuery(query) {
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
  if (!res.ok) {
    throw new Error(`${res.status} ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  console.log(`Applying ${file}...`);
  try {
    await runQuery(sql);
    console.log(`  OK`);
  } catch (e) {
    console.error(`  FAILED:`, e.message);
    process.exit(1);
  }
}

console.log("All migrations applied.");
