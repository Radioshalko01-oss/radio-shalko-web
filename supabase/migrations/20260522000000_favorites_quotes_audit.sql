-- Fase 2: persistencia real de favoritos/cotizaciones + base para audit trail
-- Idempotente: seguro de re-aplicar (if not exists / drop policy if exists).
--
-- Nota: la tabla public.favorites y sus políticas ya existen desde
-- 20260520000000 / 20260520000001. Aquí solo se garantiza el índice auxiliar.

-- ---------------------------------------------------------------------------
-- Favoritos: índice para consultas por producto (analytics futuras)
-- ---------------------------------------------------------------------------
create index if not exists favorites_product_id_idx
  on public.favorites (product_id);

-- ---------------------------------------------------------------------------
-- Cotizaciones (quotes) y sus renglones (quote_items)
-- ---------------------------------------------------------------------------
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'closed', 'cancelled')),
  note text,
  contact_name text,
  contact_phone text,
  contact_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quotes_user_id_idx on public.quotes (user_id);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity int not null default 1 check (quantity > 0),
  unit_price int,
  created_at timestamptz not null default now()
);

create index if not exists quote_items_quote_id_idx on public.quote_items (quote_id);
create index if not exists quote_items_product_id_idx on public.quote_items (product_id);

-- updated_at automático en quotes
drop trigger if exists quotes_updated_at on public.quotes;
create trigger quotes_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Audit trail de acciones administrativas (base; aún no se escribe desde app)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  metadata jsonb,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_actor_id_idx on public.admin_audit_log (actor_id);
create index if not exists admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.admin_audit_log enable row level security;

-- quotes: el dueño gestiona sus cotizaciones; admin puede leer todas
drop policy if exists "quotes_select_own" on public.quotes;
create policy "quotes_select_own" on public.quotes
  for select using (auth.uid() = user_id);
drop policy if exists "quotes_select_admin" on public.quotes;
create policy "quotes_select_admin" on public.quotes
  for select using (public.is_admin());
drop policy if exists "quotes_insert_own" on public.quotes;
create policy "quotes_insert_own" on public.quotes
  for insert with check (auth.uid() = user_id);
drop policy if exists "quotes_update_own" on public.quotes;
create policy "quotes_update_own" on public.quotes
  for update using (auth.uid() = user_id);
drop policy if exists "quotes_delete_own" on public.quotes;
create policy "quotes_delete_own" on public.quotes
  for delete using (auth.uid() = user_id);

-- quote_items: acceso a través del dueño de la cotización padre
drop policy if exists "quote_items_select_own" on public.quote_items;
create policy "quote_items_select_own" on public.quote_items
  for select using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_items.quote_id
        and (q.user_id = auth.uid() or public.is_admin())
    )
  );
drop policy if exists "quote_items_insert_own" on public.quote_items;
create policy "quote_items_insert_own" on public.quote_items
  for insert with check (
    exists (
      select 1 from public.quotes q
      where q.id = quote_items.quote_id and q.user_id = auth.uid()
    )
  );
drop policy if exists "quote_items_update_own" on public.quote_items;
create policy "quote_items_update_own" on public.quote_items
  for update using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_items.quote_id and q.user_id = auth.uid()
    )
  );
drop policy if exists "quote_items_delete_own" on public.quote_items;
create policy "quote_items_delete_own" on public.quote_items
  for delete using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_items.quote_id and q.user_id = auth.uid()
    )
  );

-- admin_audit_log: solo lectura admin. La escritura se hará con service role
-- desde el servidor (sin política de insert para clientes).
drop policy if exists "admin_audit_log_select_admin" on public.admin_audit_log;
create policy "admin_audit_log_select_admin" on public.admin_audit_log
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- HARDENING: impedir escalada de privilegios desde el cliente.
--
-- profiles_update_own permite que un usuario edite su propia fila. Sin esto,
-- un cliente malicioso podría hacer UPDATE profiles SET role='admin'.
-- El trigger fuerza que role/id nunca cambien salvo que el actor sea admin.
-- ---------------------------------------------------------------------------
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    -- Un no-admin nunca puede cambiar su rol ni su id.
    new.role := old.role;
    new.id := old.id;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_escalation on public.profiles;
create trigger profiles_prevent_escalation
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_escalation();

-- Reforzar la política de update propio con WITH CHECK explícito.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
