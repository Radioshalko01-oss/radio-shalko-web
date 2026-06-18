-- Fase 3: RLS, trigger de perfiles y buckets de Storage

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- catalog: lectura pública, escritura admin
drop policy if exists "categories_select_public" on public.categories;
create policy "categories_select_public" on public.categories for select using (true);
drop policy if exists "categories_insert_admin" on public.categories;
create policy "categories_insert_admin" on public.categories for insert with check (public.is_admin());
drop policy if exists "categories_update_admin" on public.categories;
create policy "categories_update_admin" on public.categories for update using (public.is_admin());
drop policy if exists "categories_delete_admin" on public.categories;
create policy "categories_delete_admin" on public.categories for delete using (public.is_admin());

drop policy if exists "brands_select_public" on public.brands;
create policy "brands_select_public" on public.brands for select using (true);
drop policy if exists "brands_insert_admin" on public.brands;
create policy "brands_insert_admin" on public.brands for insert with check (public.is_admin());
drop policy if exists "brands_update_admin" on public.brands;
create policy "brands_update_admin" on public.brands for update using (public.is_admin());
drop policy if exists "brands_delete_admin" on public.brands;
create policy "brands_delete_admin" on public.brands for delete using (public.is_admin());

drop policy if exists "products_select_public" on public.products;
create policy "products_select_public" on public.products for select using (true);
drop policy if exists "products_insert_admin" on public.products;
create policy "products_insert_admin" on public.products for insert with check (public.is_admin());
drop policy if exists "products_update_admin" on public.products;
create policy "products_update_admin" on public.products for update using (public.is_admin());
drop policy if exists "products_delete_admin" on public.products;
create policy "products_delete_admin" on public.products for delete using (public.is_admin());

drop policy if exists "product_images_select_public" on public.product_images;
create policy "product_images_select_public" on public.product_images for select using (true);
drop policy if exists "product_images_insert_admin" on public.product_images;
create policy "product_images_insert_admin" on public.product_images for insert with check (public.is_admin());
drop policy if exists "product_images_update_admin" on public.product_images;
create policy "product_images_update_admin" on public.product_images for update using (public.is_admin());
drop policy if exists "product_images_delete_admin" on public.product_images;
create policy "product_images_delete_admin" on public.product_images for delete using (public.is_admin());

drop policy if exists "related_products_select_public" on public.related_products;
create policy "related_products_select_public" on public.related_products for select using (true);
drop policy if exists "related_products_insert_admin" on public.related_products;
create policy "related_products_insert_admin" on public.related_products for insert with check (public.is_admin());
drop policy if exists "related_products_update_admin" on public.related_products;
create policy "related_products_update_admin" on public.related_products for update using (public.is_admin());
drop policy if exists "related_products_delete_admin" on public.related_products;
create policy "related_products_delete_admin" on public.related_products for delete using (public.is_admin());

drop policy if exists "services_select_public" on public.services;
create policy "services_select_public" on public.services for select using (true);
drop policy if exists "services_insert_admin" on public.services;
create policy "services_insert_admin" on public.services for insert with check (public.is_admin());
drop policy if exists "services_update_admin" on public.services;
create policy "services_update_admin" on public.services for update using (public.is_admin());
drop policy if exists "services_delete_admin" on public.services;
create policy "services_delete_admin" on public.services for delete using (public.is_admin());

drop policy if exists "banners_select_public" on public.banners;
create policy "banners_select_public" on public.banners for select using (true);
drop policy if exists "banners_insert_admin" on public.banners;
create policy "banners_insert_admin" on public.banners for insert with check (public.is_admin());
drop policy if exists "banners_update_admin" on public.banners;
create policy "banners_update_admin" on public.banners for update using (public.is_admin());
drop policy if exists "banners_delete_admin" on public.banners;
create policy "banners_delete_admin" on public.banners for delete using (public.is_admin());

-- favoritos: solo el dueño
drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own" on public.favorites
  for select using (auth.uid() = user_id);
drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own" on public.favorites
  for insert with check (auth.uid() = user_id);
drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own" on public.favorites
  for delete using (auth.uid() = user_id);

-- Storage buckets (imágenes públicas de catálogo)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('brand-logos', 'brand-logos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('banners', 'banners', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Storage RLS: lectura pública en buckets de catálogo; subida solo admin
drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read" on storage.objects
  for select using (bucket_id in ('product-images', 'brand-logos', 'banners'));

drop policy if exists "storage_admin_insert" on storage.objects;
create policy "storage_admin_insert" on storage.objects
  for insert with check (bucket_id in ('product-images', 'brand-logos', 'banners') and public.is_admin());

drop policy if exists "storage_admin_update" on storage.objects;
create policy "storage_admin_update" on storage.objects
  for update using (bucket_id in ('product-images', 'brand-logos', 'banners') and public.is_admin());

drop policy if exists "storage_admin_delete" on storage.objects;
create policy "storage_admin_delete" on storage.objects
  for delete using (bucket_id in ('product-images', 'brand-logos', 'banners') and public.is_admin());
