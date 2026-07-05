-- Campos de detalle de producto editables desde admin (PDP: Especificaciones, Características, Incluye).
alter table products
  add column if not exists specifications text,
  add column if not exists features text,
  add column if not exists includes text;
