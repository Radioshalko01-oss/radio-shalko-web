-- SALES-7 · Preparación, listo para recoger y entrega
-- Idempotente: seguro de re-aplicar.

alter table public.orders
  add column if not exists prepared_at timestamptz,
  add column if not exists ready_for_pickup_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists pickup_ready_message text,
  add column if not exists pickup_ready_estimate text,
  add column if not exists fulfillment_updated_by uuid references auth.users (id) on delete set null;

create index if not exists orders_fulfillment_status_idx
  on public.orders (fulfillment_status)
  where payment_status = 'paid';
