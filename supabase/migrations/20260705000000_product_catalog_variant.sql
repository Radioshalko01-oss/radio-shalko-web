-- Variante de clasificación del megamenú (ej. "4/4", "XLR / micrófono", "Guitarra eléctrica").
alter table public.products
  add column if not exists catalog_variant text;
