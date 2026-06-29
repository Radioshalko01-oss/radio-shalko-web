-- SALES-2 · Checkout solo usuarios autenticados
-- Revoca EXECUTE a anon y exige auth.uid() en create_order_from_checkout.

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
  v_item jsonb;
  v_addr jsonb;
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

  if coalesce(trim(p_payload->>'delivery_method'), '') not in (
    'pickup', 'local_delivery', 'national_shipping'
  ) then
    raise exception 'invalid_delivery_method';
  end if;

  if coalesce(trim(p_payload->>'payment_method'), '') not in (
    'mercado_pago', 'bank_transfer', 'pay_in_store'
  ) then
    raise exception 'invalid_payment_method';
  end if;

  if (p_payload->'items') is null
     or jsonb_array_length(p_payload->'items') = 0 then
    raise exception 'empty_items';
  end if;

  if (p_payload->>'subtotal')::int is null
     or (p_payload->>'shipping_cost')::int is null
     or (p_payload->>'total')::int is null then
    raise exception 'invalid_totals';
  end if;

  if (p_payload->>'delivery_method') = 'pickup'
     and (p_payload->>'branch_id') is null then
    raise exception 'branch_required';
  end if;

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
        p_payload->>'delivery_method',
        nullif(p_payload->>'branch_id', '')::uuid,
        p_payload->>'payment_method',
        (p_payload->>'subtotal')::int,
        (p_payload->>'shipping_cost')::int,
        (p_payload->>'total')::int,
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

  for v_item in select * from jsonb_array_elements(p_payload->'items')
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
      (v_item->>'product_id')::uuid,
      v_item->>'product_title',
      nullif(v_item->>'product_sku', ''),
      nullif(v_item->>'brand_name', ''),
      (v_item->>'quantity')::int,
      (v_item->>'unit_price')::int,
      (v_item->>'subtotal')::int
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
