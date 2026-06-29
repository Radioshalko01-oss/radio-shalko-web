-- ORDER-2 · Verificación del modelo de pedidos
-- Ejecutar en SQL Editor de Supabase tras aplicar 20260526000000_orders.sql

-- 1) Tablas existen
select
  table_name,
  case when table_name is not null then 'ok' else 'missing' end as status
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'orders',
    'order_items',
    'customer_addresses',
    'order_status_history'
  )
order by table_name;

-- 2) RLS activo
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'orders',
    'order_items',
    'customer_addresses',
    'order_status_history'
  )
order by c.relname;

-- 3) Políticas RLS
select
  schemaname,
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'orders',
    'order_items',
    'customer_addresses',
    'order_status_history'
  )
order by tablename, policyname;

-- 4) Índices
select
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'orders',
    'order_items',
    'customer_addresses',
    'order_status_history'
  )
order by tablename, indexname;

-- 5) Columnas principales de orders
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'orders'
order by ordinal_position;

-- 6) Constraints de estados (orders)
select
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.orders'::regclass
  and contype = 'c'
order by conname;

-- 7) Trigger updated_at en orders
select
  tgname as trigger_name,
  relname as table_name
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'orders'
  and not t.tgisinternal;
