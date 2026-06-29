-- SALES-4 · Revisión y aprobación de disponibilidad (columnas en orders)
-- Idempotente. RLS sin cambios: orders_update_admin ya cubre actualizaciones admin.

alter table public.orders
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null,
  add column if not exists availability_decision text,
  add column if not exists pickup_available_date date,
  add column if not exists admin_internal_note text,
  add column if not exists customer_message text;

-- Restricción de valores (solo si aún no existe)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_availability_decision_check'
  ) then
    alter table public.orders
      add constraint orders_availability_decision_check
      check (
        availability_decision is null
        or availability_decision in (
          'available_today',
          'available_tomorrow',
          'available_custom',
          'unavailable'
        )
      );
  end if;
end $$;

create index if not exists orders_reviewed_at_desc_idx
  on public.orders (reviewed_at desc nulls last);

create index if not exists orders_pickup_available_date_idx
  on public.orders (pickup_available_date)
  where pickup_available_date is not null;
