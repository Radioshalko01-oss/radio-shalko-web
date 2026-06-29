-- SALES-8 · Tipo order_created en customer_notifications
-- Idempotente: amplía el check constraint de type.

alter table public.customer_notifications
  drop constraint if exists customer_notifications_type_check;

alter table public.customer_notifications
  add constraint customer_notifications_type_check check (
    type in (
      'order_created',
      'order_approved',
      'payment_available',
      'payment_confirmed',
      'order_preparing',
      'order_ready_for_pickup',
      'order_delivered',
      'cart_reminder'
    )
  );
