-- Radio Shalko Web — Fase 1 · B1
-- Catálogo extendido: subcategorías, sucursales (branches), specs e inventario por sucursal.
-- Aplicar con: SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-supabase-migrations.mjs
--
-- Alcance B1 (solo schema + seeds + RLS):
--   - tabla subcategories
--   - tabla branches (sucursales escalables)
--   - tabla product_specs
--   - tabla product_inventory (por branch_id)
--   - ALTER products  (subcategory_id, sku, is_new, is_published)
--   - ALTER product_images (alt_text)
--   - seed branches (Chalco, Amecameca) + subcategorías (13, alineadas al mock)
--   - RLS de las tablas nuevas + visibilidad pública por is_published

-- =============================================================
-- 1. SUBCATEGORÍAS (segundo nivel bajo categories)
-- =============================================================
create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists subcategories_category_id_idx
  on public.subcategories (category_id);

-- =============================================================
-- 2. BRANCHES (sucursales físicas — inventario escalable)
-- =============================================================
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  display_name text not null,
  address text,
  phone_display text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists branches_is_active_idx
  on public.branches (is_active);

-- =============================================================
-- 3. PRODUCTS — columnas nuevas
-- =============================================================
alter table public.products
  add column if not exists subcategory_id uuid references public.subcategories (id) on delete set null,
  add column if not exists sku text,
  add column if not exists is_new boolean not null default false,
  add column if not exists is_published boolean not null default false;

-- sku único pero opcional (permite múltiples NULL)
create unique index if not exists products_sku_key
  on public.products (sku)
  where sku is not null;

create index if not exists products_catalog_idx
  on public.products (is_published, subcategory_id, brand_id);

-- =============================================================
-- 4. PRODUCT_IMAGES — alt_text opcional
-- =============================================================
alter table public.product_images
  add column if not exists alt_text text;

-- =============================================================
-- 5. PRODUCT_SPECS (especificaciones label/value)
-- =============================================================
create table if not exists public.product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null,
  value text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_specs_product_id_idx
  on public.product_specs (product_id);

-- =============================================================
-- 6. PRODUCT_INVENTORY (stock por producto y sucursal)
-- =============================================================
create table if not exists public.product_inventory (
  product_id uuid not null references public.products (id) on delete cascade,
  branch_id uuid not null references public.branches (id) on delete cascade,
  quantity int not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (product_id, branch_id)
);

create index if not exists product_inventory_branch_id_idx
  on public.product_inventory (branch_id);

drop trigger if exists product_inventory_updated_at on public.product_inventory;
create trigger product_inventory_updated_at
  before update on public.product_inventory
  for each row execute function public.set_updated_at();

-- =============================================================
-- 7. SEED — branches (alineadas a src/lib/site-contact.ts)
-- =============================================================
insert into public.branches (slug, name, display_name, address, sort_order) values
  ('chalco', 'Chalco', 'Valle de Chalco', 'Av. Solidaridad 142, Centro, Chalco, Edo. Méx.', 1),
  ('amecameca', 'Amecameca', 'Amecameca', 'Plaza Juárez 28, Centro, Amecameca, Edo. Méx.', 2)
on conflict (slug) do nothing;

-- =============================================================
-- 8. SEED — subcategorías (13, alineadas a CATEGORY_TREE del mock)
-- =============================================================
insert into public.subcategories (category_id, name, slug, sort_order)
select c.id, v.name, v.slug, v.sort_order
from (values
  ('instrumentos',     'Guitarras acústicas',  'guitarras-acusticas',  1),
  ('instrumentos',     'Guitarras eléctricas', 'guitarras-electricas', 2),
  ('instrumentos',     'Bajos',                'bajos',                3),
  ('instrumentos',     'Docerolas',            'docerolas',            4),
  ('instrumentos',     'Teclados',             'teclados',             5),
  ('instrumentos',     'Violines',             'violines',             6),
  ('instrumentos',     'Baterías',             'baterias',             7),
  ('instrumentos',     'Ukuleles',             'ukuleles',             8),
  ('accesorios',       'Amplificadores',       'amplificadores',       1),
  ('accesorios',       'Pedales',              'pedales',              2),
  ('accesorios',       'Cables',               'cables',               3),
  ('equipos-de-audio', 'Mezcladoras',          'mezcladoras',          1),
  ('equipos-de-audio', 'Bafles',               'bafles',               2)
) as v(category_slug, name, slug, sort_order)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;

-- =============================================================
-- 9. RLS — habilitar en tablas nuevas
-- =============================================================
alter table public.subcategories enable row level security;
alter table public.branches enable row level security;
alter table public.product_specs enable row level security;
alter table public.product_inventory enable row level security;

-- subcategories: lectura pública, escritura admin
drop policy if exists "subcategories_select_public" on public.subcategories;
create policy "subcategories_select_public" on public.subcategories for select using (true);
drop policy if exists "subcategories_insert_admin" on public.subcategories;
create policy "subcategories_insert_admin" on public.subcategories for insert with check (public.is_admin());
drop policy if exists "subcategories_update_admin" on public.subcategories;
create policy "subcategories_update_admin" on public.subcategories for update using (public.is_admin());
drop policy if exists "subcategories_delete_admin" on public.subcategories;
create policy "subcategories_delete_admin" on public.subcategories for delete using (public.is_admin());

-- branches: lectura pública, escritura admin
drop policy if exists "branches_select_public" on public.branches;
create policy "branches_select_public" on public.branches for select using (true);
drop policy if exists "branches_insert_admin" on public.branches;
create policy "branches_insert_admin" on public.branches for insert with check (public.is_admin());
drop policy if exists "branches_update_admin" on public.branches;
create policy "branches_update_admin" on public.branches for update using (public.is_admin());
drop policy if exists "branches_delete_admin" on public.branches;
create policy "branches_delete_admin" on public.branches for delete using (public.is_admin());

-- product_specs: lectura pública, escritura admin
drop policy if exists "product_specs_select_public" on public.product_specs;
create policy "product_specs_select_public" on public.product_specs for select using (true);
drop policy if exists "product_specs_insert_admin" on public.product_specs;
create policy "product_specs_insert_admin" on public.product_specs for insert with check (public.is_admin());
drop policy if exists "product_specs_update_admin" on public.product_specs;
create policy "product_specs_update_admin" on public.product_specs for update using (public.is_admin());
drop policy if exists "product_specs_delete_admin" on public.product_specs;
create policy "product_specs_delete_admin" on public.product_specs for delete using (public.is_admin());

-- product_inventory: lectura pública, escritura admin
drop policy if exists "product_inventory_select_public" on public.product_inventory;
create policy "product_inventory_select_public" on public.product_inventory for select using (true);
drop policy if exists "product_inventory_insert_admin" on public.product_inventory;
create policy "product_inventory_insert_admin" on public.product_inventory for insert with check (public.is_admin());
drop policy if exists "product_inventory_update_admin" on public.product_inventory;
create policy "product_inventory_update_admin" on public.product_inventory for update using (public.is_admin());
drop policy if exists "product_inventory_delete_admin" on public.product_inventory;
create policy "product_inventory_delete_admin" on public.product_inventory for delete using (public.is_admin());

-- =============================================================
-- 10. RLS — products: público solo ve publicados; admin ve todos
-- =============================================================
drop policy if exists "products_select_public" on public.products;
create policy "products_select_public" on public.products
  for select using (is_published = true or public.is_admin());
