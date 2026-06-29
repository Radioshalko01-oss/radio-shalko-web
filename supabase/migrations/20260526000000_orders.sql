-- ORDER-2 · Pedidos, líneas, direcciones e historial de estados
-- Idempotente: seguro de re-aplicar (if not exists / drop policy if exists).
--
-- quotes / quote_items permanecen como carrito (sin cambios).
-- Pedidos reales viven en orders + order_items.

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  customer_email text not null,
  customer_name text not null,
  customer_phone text not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'paid', 'refunded', 'failed')),
  fulfillment_status text not null default 'unfulfilled'
    check (
      fulfillment_status in (
        'unfulfilled',
        'preparing',
        'ready_for_pickup',
        'shipped',
        'delivered',
        'cancelled'
      )
    ),
  delivery_method text not null
    check (delivery_method in ('pickup', 'local_delivery', 'national_shipping')),
  branch_id uuid references public.branches (id) on delete set null,
  subtotal int not null check (subtotal >= 0),
  shipping_cost int not null default 0 check (shipping_cost >= 0),
  total int not null check (total >= 0),
  currency text not null default 'MXN',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_order_number_idx on public.orders (order_number);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists orders_created_at_desc_idx on public.orders (created_at desc);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- order_items (snapshot de producto al momento de compra)
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  product_title text not null,
  product_sku text,
  brand_name text,
  quantity int not null check (quantity > 0),
  unit_price int not null check (unit_price >= 0),
  subtotal int not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);

-- ---------------------------------------------------------------------------
-- customer_addresses (dirección asociada a un pedido)
-- ---------------------------------------------------------------------------
create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  type text not null check (type in ('shipping', 'billing')),
  full_name text not null,
  phone text not null,
  street text not null,
  exterior_number text not null,
  interior_number text,
  neighborhood text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'MX',
  references_note text,
  created_at timestamptz not null default now()
);

create index if not exists customer_addresses_order_id_idx
  on public.customer_addresses (order_id);

-- ---------------------------------------------------------------------------
-- order_status_history (auditoría de transiciones)
-- ---------------------------------------------------------------------------
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  from_status text,
  to_status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_id_idx
  on public.order_status_history (order_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.order_status_history enable row level security;

-- orders: lectura propia o admin; actualización solo admin; inserción solo admin (checkout futuro)
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "orders_select_admin" on public.orders;
create policy "orders_select_admin" on public.orders
  for select using (public.is_admin());

drop policy if exists "orders_insert_admin" on public.orders;
create policy "orders_insert_admin" on public.orders
  for insert with check (public.is_admin());

drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin" on public.orders
  for update using (public.is_admin());

-- order_items: lectura vía pedido propio o admin; escritura solo admin
drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items
  for select using (
    exists (
      select 1
      from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_items_select_admin" on public.order_items;
create policy "order_items_select_admin" on public.order_items
  for select using (public.is_admin());

drop policy if exists "order_items_insert_admin" on public.order_items;
create policy "order_items_insert_admin" on public.order_items
  for insert with check (public.is_admin());

drop policy if exists "order_items_update_admin" on public.order_items;
create policy "order_items_update_admin" on public.order_items
  for update using (public.is_admin());

drop policy if exists "order_items_delete_admin" on public.order_items;
create policy "order_items_delete_admin" on public.order_items
  for delete using (public.is_admin());

-- customer_addresses: lectura vía pedido propio o admin; escritura solo admin
drop policy if exists "customer_addresses_select_own" on public.customer_addresses;
create policy "customer_addresses_select_own" on public.customer_addresses
  for select using (
    exists (
      select 1
      from public.orders o
      where o.id = customer_addresses.order_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "customer_addresses_select_admin" on public.customer_addresses;
create policy "customer_addresses_select_admin" on public.customer_addresses
  for select using (public.is_admin());

drop policy if exists "customer_addresses_insert_admin" on public.customer_addresses;
create policy "customer_addresses_insert_admin" on public.customer_addresses
  for insert with check (public.is_admin());

drop policy if exists "customer_addresses_update_admin" on public.customer_addresses;
create policy "customer_addresses_update_admin" on public.customer_addresses
  for update using (public.is_admin());

drop policy if exists "customer_addresses_delete_admin" on public.customer_addresses;
create policy "customer_addresses_delete_admin" on public.customer_addresses
  for delete using (public.is_admin());

-- order_status_history: lectura vía pedido propio o admin; escritura solo admin
drop policy if exists "order_status_history_select_own" on public.order_status_history;
create policy "order_status_history_select_own" on public.order_status_history
  for select using (
    exists (
      select 1
      from public.orders o
      where o.id = order_status_history.order_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_status_history_select_admin" on public.order_status_history;
create policy "order_status_history_select_admin" on public.order_status_history
  for select using (public.is_admin());

drop policy if exists "order_status_history_insert_admin" on public.order_status_history;
create policy "order_status_history_insert_admin" on public.order_status_history
  for insert with check (public.is_admin());

drop policy if exists "order_status_history_update_admin" on public.order_status_history;
create policy "order_status_history_update_admin" on public.order_status_history
  for update using (public.is_admin());

drop policy if exists "order_status_history_delete_admin" on public.order_status_history;
create policy "order_status_history_delete_admin" on public.order_status_history
  for delete using (public.is_admin());
