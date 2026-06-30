alter table public.related_products enable row level security;

drop policy if exists related_products_select_public on public.related_products;
drop policy if exists related_products_insert_admin on public.related_products;
drop policy if exists related_products_update_admin on public.related_products;
drop policy if exists related_products_delete_admin on public.related_products;

create policy related_products_select_public
on public.related_products
for select
to anon, authenticated
using (true);

create policy related_products_insert_admin
on public.related_products
for insert
to authenticated
with check (public.is_admin());

create policy related_products_update_admin
on public.related_products
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy related_products_delete_admin
on public.related_products
for delete
to authenticated
using (public.is_admin());
