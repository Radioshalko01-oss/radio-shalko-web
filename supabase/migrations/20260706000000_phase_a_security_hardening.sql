-- Phase A · Seguridad crítica — Radio Shalko WEB
-- 1) create_order_from_checkout: precios/totales calculados en servidor SQL
-- 2) products RLS: no exponer borradores a usuarios no admin

-- =============================================================================
-- 1. RPC segura: create_order_from_checkout
-- =============================================================================
create or replace function public.create_order_from_checkout(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_year text;
  v_seq int;
  v_attempt int := 0;
  v_user_id uuid;
  v_line record;
  v_addr jsonb;
  v_delivery_method text;
  v_payment_method text;
  v_subtotal int := 0;
  v_shipping_cost int := 0;
  v_total int := 0;
  v_line_count int := 0;
  v_unresolved int := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  if p_payload is null then
    raise exception 'payload_required';
  end if;

  if coalesce(trim(p_payload->>'customer_email'), '') = ''
     or coalesce(trim(p_payload->>'customer_name'), '') = ''
     or coalesce(trim(p_payload->>'customer_phone'), '') = '' then
    raise exception 'invalid_customer';
  end if;

  v_delivery_method := coalesce(trim(p_payload->>'delivery_method'), '');
  if v_delivery_method not in ('pickup', 'local_delivery', 'national_shipping') then
    raise exception 'invalid_delivery_method';
  end if;

  v_payment_method := coalesce(trim(p_payload->>'payment_method'), '');
  if v_payment_method not in ('mercado_pago', 'bank_transfer', 'pay_in_store') then
    raise exception 'invalid_payment_method';
  end if;

  if p_payload->'items' is null
     or jsonb_array_length(p_payload->'items') = 0 then
    raise exception 'empty_items';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_payload->'items') as elem
    where coalesce(nullif(trim(elem->>'quantity'), '')::int, 0) < 1
  ) then
    raise exception 'invalid_quantity';
  end if;

  if v_delivery_method = 'pickup'
     and nullif(trim(p_payload->>'branch_id'), '') is null then
    raise exception 'branch_required';
  end if;

  if v_delivery_method = 'pickup' then
    if not exists (
      select 1
      from public.branches b
      where b.id = nullif(trim(p_payload->>'branch_id'), '')::uuid
        and b.is_active = true
    ) then
      raise exception 'invalid_branch';
    end if;
  end if;

  -- Tabla temporal: consolida product_id duplicados sumando cantidades.
  create temp table _checkout_lines (
    product_id uuid primary key,
    quantity int not null check (quantity > 0),
    product_title text,
    product_sku text,
    brand_name text,
    unit_price int,
    subtotal int
  ) on commit drop;

  begin
    insert into _checkout_lines (product_id, quantity)
    select
      (elem->>'product_id')::uuid,
      sum(coalesce(nullif(trim(elem->>'quantity'), '')::int, 0))::int
    from jsonb_array_elements(p_payload->'items') as elem
    where nullif(trim(elem->>'product_id'), '') is not null
    group by 1;
  exception
    when invalid_text_representation then
      raise exception 'invalid_product_id';
  end;

  select count(*) into v_line_count from _checkout_lines;
  if v_line_count = 0 then
    raise exception 'empty_items';
  end if;

  if exists (select 1 from _checkout_lines where product_id is null) then
    raise exception 'invalid_product_id';
  end if;

  -- Resolver precios reales desde products (solo publicados).
  update _checkout_lines cl
  set
    product_title = p.title,
    product_sku = p.sku,
    brand_name = b.name,
    unit_price = round(p.price)::int,
    subtotal = round(p.price)::int * cl.quantity
  from public.products p
  left join public.brands b on b.id = p.brand_id
  where p.id = cl.product_id
    and p.is_published = true
    and p.price is not null
    and round(p.price)::int >= 0;

  select count(*) into v_unresolved
  from _checkout_lines
  where product_title is null;

  if v_unresolved > 0 then
    if exists (
      select 1
      from _checkout_lines cl
      join public.products p on p.id = cl.product_id
      where cl.product_title is null
        and p.is_published = false
    ) then
      raise exception 'product_not_published';
    end if;

    if exists (
      select 1
      from _checkout_lines cl
      join public.products p on p.id = cl.product_id
      where cl.product_title is null
        and p.is_published = true
        and (p.price is null or round(p.price)::int < 0)
    ) then
      raise exception 'invalid_product_price';
    end if;

    raise exception 'product_not_found';
  end if;

  select coalesce(sum(subtotal), 0)
  into v_subtotal
  from _checkout_lines;

  if v_subtotal <= 0 then
    raise exception 'invalid_product_price';
  end if;

  -- Envío controlado por servidor. Hoy checkout = pickup → 0.
  v_shipping_cost := 0;
  v_total := v_subtotal + v_shipping_cost;

  v_year := to_char(now(), 'YYYY');

  loop
    v_attempt := v_attempt + 1;

    select coalesce(
      max(
        nullif(
          regexp_replace(order_number, '^RS-' || v_year || '-', ''),
          order_number
        )::int
      ),
      0
    ) + 1
    into v_seq
    from public.orders
    where order_number like 'RS-' || v_year || '-%';

    v_order_number := 'RS-' || v_year || '-' || lpad(v_seq::text, 6, '0');

    begin
      insert into public.orders (
        order_number,
        user_id,
        customer_email,
        customer_name,
        customer_phone,
        status,
        payment_status,
        fulfillment_status,
        delivery_method,
        branch_id,
        payment_method,
        subtotal,
        shipping_cost,
        total,
        currency,
        notes
      ) values (
        v_order_number,
        v_user_id,
        trim(p_payload->>'customer_email'),
        trim(p_payload->>'customer_name'),
        trim(p_payload->>'customer_phone'),
        'pending',
        'unpaid',
        'unfulfilled',
        v_delivery_method,
        nullif(trim(p_payload->>'branch_id'), '')::uuid,
        v_payment_method,
        v_subtotal,
        v_shipping_cost,
        v_total,
        coalesce(nullif(trim(p_payload->>'currency'), ''), 'MXN'),
        nullif(trim(p_payload->>'notes'), '')
      )
      returning id into v_order_id;

      exit;
    exception
      when unique_violation then
        if v_attempt >= 5 then
          raise;
        end if;
    end;
  end loop;

  for v_line in select * from _checkout_lines
  loop
    insert into public.order_items (
      order_id,
      product_id,
      product_title,
      product_sku,
      brand_name,
      quantity,
      unit_price,
      subtotal
    ) values (
      v_order_id,
      v_line.product_id,
      v_line.product_title,
      v_line.product_sku,
      v_line.brand_name,
      v_line.quantity,
      v_line.unit_price,
      v_line.subtotal
    );
  end loop;

  v_addr := p_payload->'address';
  if v_addr is not null and v_addr <> 'null'::jsonb then
    insert into public.customer_addresses (
      order_id,
      type,
      full_name,
      phone,
      street,
      exterior_number,
      interior_number,
      neighborhood,
      city,
      state,
      postal_code,
      country,
      references_note
    ) values (
      v_order_id,
      coalesce(nullif(v_addr->>'type', ''), 'shipping'),
      v_addr->>'full_name',
      v_addr->>'phone',
      v_addr->>'street',
      v_addr->>'exterior_number',
      nullif(v_addr->>'interior_number', ''),
      v_addr->>'neighborhood',
      v_addr->>'city',
      v_addr->>'state',
      v_addr->>'postal_code',
      coalesce(nullif(v_addr->>'country', ''), 'MX'),
      nullif(v_addr->>'references_note', '')
    );
  end if;

  insert into public.order_status_history (
    order_id,
    actor_id,
    from_status,
    to_status,
    note
  ) values (
    v_order_id,
    v_user_id,
    null,
    'pending',
    'Solicitud creada desde checkout'
  );

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number
  );
end;
$$;

revoke all on function public.create_order_from_checkout(jsonb) from public;
revoke execute on function public.create_order_from_checkout(jsonb) from anon;
grant execute on function public.create_order_from_checkout(jsonb) to authenticated;

-- =============================================================================
-- 2. RLS products: solo publicados para no-admin; admin ve todos
-- =============================================================================
drop policy if exists "products_select_public" on public.products;

create policy "products_select_public" on public.products
  for select using (is_published = true or public.is_admin());
