-- SALES-7.2 · Notificaciones internas del cliente
-- Idempotente: seguro de re-aplicar.

create table if not exists public.customer_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (
    type in (
      'order_approved',
      'payment_available',
      'payment_confirmed',
      'order_preparing',
      'order_ready_for_pickup',
      'order_delivered',
      'cart_reminder'
    )
  ),
  title text not null,
  message text not null,
  href text,
  order_id uuid references public.orders (id) on delete cascade,
  metadata jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists customer_notifications_user_id_idx
  on public.customer_notifications (user_id);

create index if not exists customer_notifications_user_unread_idx
  on public.customer_notifications (user_id, created_at desc)
  where read_at is null;

create index if not exists customer_notifications_order_id_idx
  on public.customer_notifications (order_id)
  where order_id is not null;

alter table public.customer_notifications enable row level security;

drop policy if exists "customer_notifications_select_own" on public.customer_notifications;
create policy "customer_notifications_select_own" on public.customer_notifications
  for select using (auth.uid() = user_id);

drop policy if exists "customer_notifications_update_own" on public.customer_notifications;
create policy "customer_notifications_update_own" on public.customer_notifications
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- INSERT solo vía service role / Server Actions admin (sin policy INSERT para authenticated).
