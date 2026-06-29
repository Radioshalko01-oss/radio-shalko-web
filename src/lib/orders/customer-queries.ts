/**
 * Consultas de pedidos del cliente · SALES-5.2.
 * RLS: orders_select_own, order_items_select_own.
 */
import { createClient } from "@/lib/supabase/server";
import { branchDisplayName } from "@/lib/orders/status-labels";

export type CustomerOrderListItem = {
  id: string;
  orderNumber: string;
  branchSlug: string | null;
  branchLabel: string;
  itemCount: number;
  total: number;
  status: string;
  paymentStatus: string;
  hasPaymentUrl: boolean;
  fulfillmentStatus: string;
  createdAt: string;
};

export type CustomerOrderLineItem = {
  id: string;
  productTitle: string;
  brandName: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl: string | null;
};

export type CustomerOrderDetail = CustomerOrderListItem & {
  notes: string | null;
  subtotal: number;
  shippingCost: number;
  customerMessage: string | null;
  pickupAvailableDate: string | null;
  stripePaymentUrl: string | null;
  stripePaidAt: string | null;
  pickupReadyMessage: string | null;
  pickupReadyEstimate: string | null;
  deliveredAt: string | null;
  items: CustomerOrderLineItem[];
};

export type CustomerOrderSummary = {
  totalOrders: number;
  pendingReviewCount: number;
  awaitingPaymentCount: number;
  paymentAvailableCount: number;
  readyForPickupCount: number;
  preparingCount: number;
  recentCancelledCount: number;
  hasAttention: boolean;
};

const ORDER_LIST_SELECT = `
  id,
  order_number,
  status,
  payment_status,
  total,
  created_at,
  stripe_payment_url,
  fulfillment_status,
  branch_id,
  branches ( slug, display_name, name ),
  order_items ( id )
`;

const ORDER_DETAIL_SELECT = `
  id,
  order_number,
  status,
  payment_status,
  subtotal,
  shipping_cost,
  total,
  notes,
  created_at,
  customer_message,
  pickup_available_date,
  stripe_payment_url,
  stripe_paid_at,
  fulfillment_status,
  pickup_ready_message,
  pickup_ready_estimate,
  delivered_at,
  branch_id,
  branches ( slug, display_name, name ),
  order_items (
    id, product_id, product_title, brand_name,
    quantity, unit_price, subtotal
  )
`;

type RawBranch = { slug: string; display_name: string; name: string } | null;

type RawOrderList = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  stripe_payment_url: string | null;
  fulfillment_status: string;
  branches: RawBranch;
  order_items?: Array<{ id: string }> | null;
};

type RawOrderItem = {
  id: string;
  product_id: string;
  product_title: string;
  brand_name: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

function mapListItem(row: RawOrderList): CustomerOrderListItem {
  const slug = row.branches?.slug ?? null;
  return {
    id: row.id,
    orderNumber: row.order_number,
    branchSlug: slug,
    branchLabel: branchDisplayName(slug, row.branches?.display_name ?? row.branches?.name),
    itemCount: row.order_items?.length ?? 0,
    total: row.total,
    status: row.status,
    paymentStatus: row.payment_status,
    hasPaymentUrl: Boolean(row.stripe_payment_url),
    fulfillmentStatus: row.fulfillment_status,
    createdAt: row.created_at,
  };
}

async function fetchProductImages(productIds: string[]): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  if (!productIds.length) return map;

  const supabase = await createClient();
  const { data } = await supabase
    .from("product_images")
    .select("product_id, url, sort_order")
    .in("product_id", productIds)
    .order("sort_order", { ascending: true });

  for (const row of data ?? []) {
    if (!map.has(row.product_id)) {
      map.set(row.product_id, row.url);
    }
  }
  return map;
}

export async function getCustomerOrderSummary(): Promise<CustomerOrderSummary | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const recentCancelledFrom = new Date();
  recentCancelledFrom.setDate(recentCancelledFrom.getDate() - 14);

  const [total, pending, readyForPickup, paymentAvailable, preparing, awaitingWithoutLink, cancelledRecent] =
    await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("payment_status", "unpaid"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "paid")
      .eq("fulfillment_status", "ready_for_pickup"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed")
      .eq("payment_status", "unpaid")
      .not("stripe_payment_url", "is", null),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "paid")
      .eq("fulfillment_status", "preparing"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed")
      .eq("payment_status", "unpaid")
      .is("stripe_payment_url", null),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelled")
      .gte("updated_at", recentCancelledFrom.toISOString()),
  ]);

  const pendingReviewCount = pending.count ?? 0;
  const readyForPickupCount = readyForPickup.count ?? 0;
  const paymentAvailableCount = paymentAvailable.count ?? 0;
  const preparingCount = preparing.count ?? 0;
  const awaitingPaymentCount = awaitingWithoutLink.count ?? 0;
  const recentCancelledCount = cancelledRecent.count ?? 0;

  return {
    totalOrders: total.count ?? 0,
    pendingReviewCount,
    awaitingPaymentCount,
    paymentAvailableCount,
    readyForPickupCount,
    preparingCount,
    recentCancelledCount,
    hasAttention:
      readyForPickupCount > 0 ||
      paymentAvailableCount > 0 ||
      preparingCount > 0 ||
      pendingReviewCount > 0,
  };
}

export function customerOrdersCardDescription(summary: CustomerOrderSummary): string {
  if (summary.readyForPickupCount > 0) {
    return summary.readyForPickupCount === 1
      ? "1 listo para recoger"
      : `${summary.readyForPickupCount} listos para recoger`;
  }
  if (summary.paymentAvailableCount > 0) {
    return summary.paymentAvailableCount === 1
      ? "1 requiere atención"
      : `${summary.paymentAvailableCount} requieren atención`;
  }
  if (summary.preparingCount > 0) {
    return summary.preparingCount === 1
      ? "1 en preparación"
      : `${summary.preparingCount} en preparación`;
  }
  if (summary.pendingReviewCount > 0) {
    return summary.pendingReviewCount === 1
      ? "1 en revisión"
      : `${summary.pendingReviewCount} en revisión`;
  }
  if (summary.awaitingPaymentCount > 0) {
    return summary.awaitingPaymentCount === 1
      ? "1 aprobado · esperando pago"
      : `${summary.awaitingPaymentCount} aprobados · esperando pago`;
  }
  return "Consulta tus solicitudes";
}

export async function listCustomerOrders(): Promise<CustomerOrderListItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_LIST_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[listCustomerOrders]", error.message);
    return [];
  }

  return ((data ?? []) as unknown as RawOrderList[]).map(mapListItem);
}

export async function getCustomerOrder(id: string): Promise<CustomerOrderDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as Omit<RawOrderList, "order_items"> & {
    subtotal: number;
    shipping_cost: number;
    notes: string | null;
    customer_message: string | null;
    pickup_available_date: string | null;
    stripe_payment_url: string | null;
    stripe_paid_at: string | null;
    fulfillment_status: string;
    pickup_ready_message: string | null;
    pickup_ready_estimate: string | null;
    delivered_at: string | null;
    order_items: RawOrderItem[] | null;
  };

  const lineItems: RawOrderItem[] = row.order_items ?? [];
  const base = mapListItem({ ...row, order_items: lineItems.map((i) => ({ id: i.id })) });
  const productIds = lineItems.map((i) => i.product_id);
  const images = await fetchProductImages(productIds);

  const items: CustomerOrderLineItem[] = lineItems.map((item) => ({
    id: item.id,
    productTitle: item.product_title,
    brandName: item.brand_name,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    subtotal: item.subtotal,
    imageUrl: images.get(item.product_id) ?? null,
  }));

  return {
    ...base,
    notes: row.notes,
    subtotal: row.subtotal,
    shippingCost: row.shipping_cost,
    customerMessage: row.customer_message,
    pickupAvailableDate: row.pickup_available_date,
    stripePaymentUrl: row.stripe_payment_url,
    stripePaidAt: row.stripe_paid_at,
    pickupReadyMessage: row.pickup_ready_message,
    pickupReadyEstimate: row.pickup_ready_estimate,
    deliveredAt: row.delivered_at,
    items,
  };
}
