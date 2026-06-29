-- CART-5 · Carritos compartibles (vendedor → cliente vía enlace)
-- Idempotente: seguro de re-aplicar.

-- ---------------------------------------------------------------------------
-- shared_carts: snapshot de carrito POS con token público de solo lectura
-- ---------------------------------------------------------------------------
create table if not exists public.shared_carts (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  created_by uuid references auth.users (id) on delete set null,
  sale_label text,
  branch_name text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists shared_carts_token_idx on public.shared_carts (token);
create index if not exists shared_carts_expires_at_idx on public.shared_carts (expires_at);

-- ---------------------------------------------------------------------------
-- shared_cart_items: líneas con precio unitario congelado al compartir
-- ---------------------------------------------------------------------------
create table if not exists public.shared_cart_items (
  id uuid primary key default gen_random_uuid(),
  shared_cart_id uuid not null references public.shared_carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity int not null check (quantity > 0),
  unit_price int not null check (unit_price >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists shared_cart_items_cart_id_idx
  on public.shared_cart_items (shared_cart_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.shared_carts enable row level security;
alter table public.shared_cart_items enable row level security;

-- Lectura pública solo si no expiró (anon + autenticados)
drop policy if exists "shared_carts_select_public" on public.shared_carts;
create policy "shared_carts_select_public" on public.shared_carts
  for select using (expires_at > now());

-- Solo admin crea carritos compartidos
drop policy if exists "shared_carts_insert_admin" on public.shared_carts;
create policy "shared_carts_insert_admin" on public.shared_carts
  for insert with check (public.is_admin());

drop policy if exists "shared_cart_items_select_public" on public.shared_cart_items;
create policy "shared_cart_items_select_public" on public.shared_cart_items
  for select using (
    exists (
      select 1
      from public.shared_carts sc
      where sc.id = shared_cart_id
        and sc.expires_at > now()
    )
  );

drop policy if exists "shared_cart_items_insert_admin" on public.shared_cart_items;
create policy "shared_cart_items_insert_admin" on public.shared_cart_items
  for insert with check (
    public.is_admin()
    and exists (
      select 1
      from public.shared_carts sc
      where sc.id = shared_cart_id
    )
  );
