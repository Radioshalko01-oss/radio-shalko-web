#!/usr/bin/env node
/**
 * Verifica migraciones Sales OS v1 en Supabase Radio Shalko.
 *
 * Uso:
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/verify-sales-os-migrations.mjs
 *
 * Proyecto: actxvfjtejmpkjernvtw (Radio Shalko — NO SEEDIS)
 */
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? "actxvfjtejmpkjernvtw";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!TOKEN) {
  console.error("Falta SUPABASE_ACCESS_TOKEN (Personal Access Token de Supabase)");
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
const check = (label, pass, detail = "") => results.push({ label, pass, detail });

const SALES_MIGRATIONS = [
  "20260526000000_orders.sql",
  "20260527000000_order_checkout.sql",
  "20260528000000_order_checkout_auth_only.sql",
  "20260529000000_order_availability_review.sql",
  "20260530000000_order_stripe_checkout.sql",
  "20260531000000_order_fulfillment_pickup.sql",
  "20260532000000_customer_notifications.sql",
  "20260533000000_customer_notifications_order_created.sql",
];

try {
  // Tabla orders
  const orderCols = await q(`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'orders'
    order by column_name;
  `);
  const orderColSet = new Set(orderCols.map((r) => r.column_name));
  for (const col of [
    "id",
    "order_number",
    "status",
    "payment_status",
    "fulfillment_status",
    "reviewed_at",
    "availability_decision",
    "customer_message",
    "admin_internal_note",
    "stripe_payment_url",
    "stripe_paid_at",
    "prepared_at",
    "ready_for_pickup_at",
    "delivered_at",
    "pickup_ready_message",
  ]) {
    check(`orders.${col}`, orderColSet.has(col));
  }

  // order_items
  const items = await q(`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_name = 'order_items';
  `);
  check("tabla order_items", items.length > 0);

  // RPC checkout
  const rpc = await q(`
    select proname from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and proname = 'create_order_from_checkout';
  `);
  check("función create_order_from_checkout", rpc.length > 0);

  // customer_notifications
  const notif = await q(`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_name = 'customer_notifications';
  `);
  check("tabla customer_notifications", notif.length > 0);

  // order_created en check constraint
  const constraint = await q(`
    select pg_get_constraintdef(c.oid) as def
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'customer_notifications'
      and c.conname = 'customer_notifications_type_check';
  `);
  const def = constraint[0]?.def ?? "";
  check(
    "customer_notifications incluye order_created",
    def.includes("order_created"),
    def.slice(0, 120) || "constraint no encontrado — aplicar 20260533000000",
  );

  // RLS orders
  const rls = await q(`
    select relrowsecurity from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'orders';
  `);
  check("RLS activo en orders", rls[0]?.relrowsecurity === true);

  console.log("\nSales OS migrations checklist (repo):\n");
  for (const m of SALES_MIGRATIONS) console.log(`  · ${m}`);

  console.log("\nVerificación remota:\n");
  let failed = 0;
  for (const r of results) {
    const icon = r.pass ? "✓" : "✗";
    console.log(`  ${icon} ${r.label}${r.detail && !r.pass ? ` — ${r.detail}` : ""}`);
    if (!r.pass) failed++;
  }

  console.log(failed === 0 ? "\nOK — Sales OS schema verificado.\n" : `\n${failed} comprobación(es) fallaron.\n`);
  process.exit(failed === 0 ? 0 : 1);
} catch (e) {
  console.error("Error:", e.message);
  process.exit(1);
}
