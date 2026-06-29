-- SALES-6 · Stripe Checkout Session en pedidos aprobados
-- Idempotente: seguro de re-aplicar.

alter table public.orders
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists stripe_payment_url text,
  add column if not exists stripe_payment_created_at timestamptz,
  add column if not exists stripe_paid_at timestamptz,
  add column if not exists payment_requested_at timestamptz,
  add column if not exists payment_requested_by uuid references auth.users (id) on delete set null,
  add column if not exists payment_provider text default 'stripe';

create index if not exists orders_stripe_checkout_session_id_idx
  on public.orders (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
