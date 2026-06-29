-- PRO-3: el admin puede actualizar cotizaciones (p. ej. cambiar estado).
drop policy if exists "quotes_update_admin" on public.quotes;
create policy "quotes_update_admin" on public.quotes
  for update using (public.is_admin());
