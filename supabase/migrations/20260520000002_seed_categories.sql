-- Categorías iniciales (alineadas al catálogo mock / home)
insert into public.categories (name, slug, sort_order) values
  ('Instrumentos', 'instrumentos', 1),
  ('Accesorios', 'accesorios', 2),
  ('Equipos de Audio', 'equipos-de-audio', 3)
on conflict (slug) do nothing;
