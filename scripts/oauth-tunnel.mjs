#!/usr/bin/env node
/**
 * Túnel HTTPS temporal para probar OAuth en iPhone (Supabase no acepta IPs LAN).
 *
 * Uso: npm run tunnel:oauth
 *
 * 1. Copia la URL https://….trycloudflare.com
 * 2. Supabase → Authentication → Redirect URLs → agrega:
 *    https://TU-URL.trycloudflare.com/**
 *    (o ejecuta npm run configure:auth con el wildcard ya incluido)
 * 3. En el iPhone abre https://TU-URL.trycloudflare.com/login
 *    (NO uses http://192.168.x.x — OAuth no funciona ahí)
 */
import { spawn } from "child_process";

const PORT = process.env.PORT ?? "3002";

console.log(`\nIniciando túnel hacia http://127.0.0.1:${PORT} …\n`);
console.log("Asegúrate de que el servidor Next esté corriendo (npm run dev o npm run start).\n");

const child = spawn(
  "npx",
  ["--yes", "cloudflared", "tunnel", "--url", `http://127.0.0.1:${PORT}`],
  { stdio: ["inherit", "pipe", "pipe"] },
);

let printed = false;

function onLine(line) {
  process.stdout.write(`${line}\n`);
  const match = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/.exec(line);
  if (match && !printed) {
    printed = true;
    const url = match[0];
    console.log("\n────────────────────────────────────────────");
    console.log("  OAuth en iPhone — usa ESTA URL (no la IP local):");
    console.log(`  ${url}/login`);
    console.log("\n  Supabase → Redirect URLs (si falta):");
    console.log(`  ${url}/**`);
    console.log("────────────────────────────────────────────\n");
  }
}

child.stdout.on("data", (buf) => {
  for (const line of buf.toString().split("\n")) onLine(line);
});

child.stderr.on("data", (buf) => {
  for (const line of buf.toString().split("\n")) onLine(line);
});

child.on("close", (code) => process.exit(code ?? 0));

process.on("SIGINT", () => {
  child.kill("SIGINT");
});
