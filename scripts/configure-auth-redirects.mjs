#!/usr/bin/env node
/**
 * Añade Redirect URLs de OAuth en Supabase (Management API).
 *
 * Uso:
 *   1. Crea un token en https://supabase.com/dashboard/account/tokens
 *   2. Añade a .env.local: SUPABASE_ACCESS_TOKEN=sbp_...
 *   3. npm run configure:auth
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? "actxvfjtejmpkjernvtw";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

const REQUIRED_REDIRECTS = [
  "http://localhost:3002/auth/callback",
  "http://localhost:3002/**",
  "http://localhost:3000/auth/callback",
  "http://localhost:3003/auth/callback",
  "https://radio-shalko-web.vercel.app/auth/callback",
  "https://radio-shalko-web.vercel.app/**",
  // Vercel Preview (branch + deployment URLs)
  "https://radio-shalko-*-radio-shalko.vercel.app/auth/callback",
  "https://radio-shalko-*-radio-shalko.vercel.app/**",
  "https://radio-shalko-web-git-*-radio-shalko.vercel.app/auth/callback",
  "https://radio-shalko-web-git-*-radio-shalko.vercel.app/**",
  // Túnel temporal (Cloudflare quick tunnel) para OAuth en iPhone
  "https://*.trycloudflare.com/auth/callback",
  "https://*.trycloudflare.com/**",
];

const SITE_URL = "https://radio-shalko-web.vercel.app";

if (!TOKEN) {
  console.error(
    "Falta SUPABASE_ACCESS_TOKEN en .env.local\n" +
      "Crea uno en: https://supabase.com/dashboard/account/tokens",
  );
  process.exit(1);
}

async function getAuthConfig() {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    { headers: { Authorization: `Bearer ${TOKEN}` } },
  );
  const body = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${body}`);
  return JSON.parse(body);
}

async function patchAuthConfig(payload) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  const body = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${body}`);
  return body ? JSON.parse(body) : null;
}

function parseAllowList(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function mergeAllowList(existing, required) {
  const seen = new Set();
  const merged = [];
  for (const url of [...existing, ...required]) {
    if (!seen.has(url)) {
      seen.add(url);
      merged.push(url);
    }
  }
  return merged;
}

try {
  const current = await getAuthConfig();
  const existing = parseAllowList(current.uri_allow_list);
  const merged = mergeAllowList(existing, REQUIRED_REDIRECTS);

  console.log("Proyecto:", PROJECT_REF);
  console.log("Site URL actual:", current.site_url ?? "(vacío)");
  console.log("Redirect URLs actuales:", existing.length ? existing.join(", ") : "(ninguna)");

  await patchAuthConfig({
    site_url: SITE_URL,
    uri_allow_list: merged.join(","),
  });

  console.log("\n✓ Configuración actualizada:");
  console.log("  site_url:", SITE_URL);
  console.log("  uri_allow_list:");
  for (const url of merged) console.log("   -", url);
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
