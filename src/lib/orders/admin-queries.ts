/**
 * Consultas admin · SALES-3 (solo lectura).
 * RLS: orders_select_admin, order_items_select_admin, order_status_history_select_admin.
 */
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { branchDisplayName } from "@/lib/orders/status-labels";
import {
  canValidateManualPayment,
  isPaymentMethodConfirmed,
  parseOperationalMetadata,
  warrantyDisplayLabel,
  type OrderOperationalMeta,
} from "@/lib/orders/operational-metadata";

export type AdminOrderFilter =
  | "all"
  | "pending"
  | "approved"
  | "chalco"
  | "amecameca"
  | "paid"
  | "ready_for_pickup"
  | "delivered"
  | "cancelled";

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  branchSlug: string | null;
  branchLabel: string;
  itemCount: number;
  total: number;
  status: string;
  paymentStatus: string;
  availabilityDecision: string | null;
  pickupAvailableDate: string | null;
  createdAt: string;
  hasPaymentUrl: boolean;
  fulfillmentStatus: string;
};

export type AdminOrderLineItem = {
  id: string;
  productId: string;
  productTitle: string;
  productSku: string | null;
  brandName: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl: string | null;
};

export type AdminOrderHistoryEntry = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  createdAt: string;
};

export type AdminOrderDetail = AdminOrderListItem & {
  notes: string | null;
  subtotal: number;
  shippingCost: number;
  deliveryMethod: string;
  fulfillmentStatus: string;
  reviewedAt: string | null;
  customerMessage: string | null;
  adminInternalNote: string | null;
  stripePaymentUrl: string | null;
  stripePaidAt: string | null;
  paymentMethod: string;
  paymentRequestedAt: string | null;
  preparedAt: string | null;
  readyForPickupAt: string | null;
  deliveredAt: string | null;
  pickupReadyMessage: string | null;
  pickupReadyEstimate: string | null;
  items: AdminOrderLineItem[];
  history: AdminOrderHistoryEntry[];
  operational: OrderOperationalMeta;
  legacyAdminNote: string | null;
  confirmedFinalPrice: number | null;
  confirmedFinalPriceNote: string | null;
  confirmedFinalPriceAt: string | null;
  warrantyLabel: string | null;
  paymentMethodConfirmed: boolean;
  paymentInstructionsSent: boolean;
  canValidatePayment: boolean;
};

export type AdminOrderListFilters = {
  q?: string;
  filter?: AdminOrderFilter;
  page?: number;
  perPage?: number;
};

export type AdminOrderListResult = {
  items: AdminOrderListItem[];
  total: number;
  page: number;
  perPage: number;
  pendingCount: number;
};

const ORDER_SELECT = `
  id,
  order_number,
  customer_name,
  customer_email,
  customer_phone,
  status,
  payment_status,
  fulfillment_status,
  delivery_method,
  subtotal,
  shipping_cost,
  total,
  notes,
  created_at,
  branch_id,
  availability_decision,
  pickup_available_date,
  reviewed_at,
  customer_message,
  admin_internal_note,
  stripe_payment_url,
  stripe_paid_at,
  payment_method,
  payment_requested_at,
  prepared_at,
  ready_for_pickup_at,
  delivered_at,
  pickup_ready_message,
  pickup_ready_estimate,
  branches ( slug, display_name, name )
`;

type RawBranch = { slug: string; display_name: string; name: string } | null;

type RawOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  delivery_method: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  notes: string | null;
  created_at: string;
  branch_id: string | null;
  availability_decision: string | null;
  pickup_available_date: string | null;
  reviewed_at: string | null;
  customer_message: string | null;
  admin_internal_note: string | null;
  stripe_payment_url: string | null;
  stripe_paid_at: string | null;
  payment_method: string;
  payment_requested_at: string | null;
  prepared_at: string | null;
  ready_for_pickup_at: string | null;
  delivered_at: string | null;
  pickup_ready_message: string | null;
  pickup_ready_estimate: string | null;
  branches: RawBranch;
  order_items?: Array<{ id: string }> | null;
};

type RawOrderItem = {
  id: string;
  product_id: string;
  product_title: string;
  product_sku: string | null;
  brand_name: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

type RawHistory = {
  id: string;
  from_status: string | null;
  to_status: string;
  note: string | null;
  created_at: string;
};

function escapeIlike(value: string): string {
  return value.replace(/[%_,\\]/g, "\\$&");
}

const PRIORITY_SORT_MAX = 300;

function orderListPriority(item: AdminOrderListItem): number {
  if (item.paymentStatus === "paid" && item.fulfillmentStatus === "ready_for_pickup") return 0;
  if (item.status === "pending" && item.paymentStatus === "unpaid") return 1;
  if (item.status === "confirmed" && item.paymentStatus === "unpaid") return 2;
  if (item.paymentStatus === "paid" && item.fulfillmentStatus === "preparing") return 3;
  return 4;
}

function sortOrdersByPriority(items: AdminOrderListItem[]): AdminOrderListItem[] {
  return [...items].sort((a, b) => {
    const pa = orderListPriority(a);
    const pb = orderListPriority(b);
    if (pa !== pb) return pa - pb;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function mapListItem(row: RawOrder): AdminOrderListItem {
  const slug = row.branches?.slug ?? null;
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    branchSlug: slug,
    branchLabel: branchDisplayName(slug, row.branches?.display_name ?? row.branches?.name),
    itemCount: row.order_items?.length ?? 0,
    total: row.total,
    status: row.status,
    paymentStatus: row.payment_status,
    availabilityDecision: row.availability_decision,
    pickupAvailableDate: row.pickup_available_date,
    createdAt: row.created_at,
    hasPaymentUrl: Boolean(row.stripe_payment_url),
    fulfillmentStatus: row.fulfillment_status,
  };
}

async function fetchProductImages(
  productIds: string[],
): Promise<Map<string, string | null>> {
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

export async function listAdminOrders(
  filters: AdminOrderListFilters = {},
): Promise<AdminOrderListResult> {
  await requireAdmin();
  const supabase = await createClient();

  const page = Math.max(1, filters.page ?? 1);
  const perPage = filters.perPage === 50 ? 50 : filters.perPage === 100 ? 100 : 25;
  const filter = filters.filter ?? "all";
  const q = filters.q?.trim() ?? "";

  let query = supabase
    .from("orders")
    .select(`${ORDER_SELECT}, order_items ( id )`, { count: "exact" })
    .order("created_at", { ascending: false });

  if (filter === "pending") {
    query = query.eq("status", "pending").eq("payment_status", "unpaid");
  } else if (filter === "approved") {
    query = query.eq("status", "confirmed").eq("payment_status", "unpaid");
  } else if (filter === "paid") {
    query = query.eq("payment_status", "paid");
  } else if (filter === "ready_for_pickup") {
    query = query.eq("payment_status", "paid").eq("fulfillment_status", "ready_for_pickup");
  } else if (filter === "delivered") {
    query = query.eq("fulfillment_status", "delivered");
  } else if (filter === "cancelled") {
    query = query.eq("status", "cancelled");
  } else if (filter === "chalco" || filter === "amecameca") {
    const { data: branch } = await supabase
      .from("branches")
      .select("id")
      .eq("slug", filter)
      .maybeSingle();
    if (branch) query = query.eq("branch_id", branch.id);
    else query = query.eq("branch_id", "00000000-0000-0000-0000-000000000000");
  }

  if (q) {
    const term = escapeIlike(q);
    query = query.or(
      `order_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_email.ilike.%${term}%,customer_phone.ilike.%${term}%`,
    );
  }

  const usePrioritySort = filter === "all" && !q;

  let data;
  let count: number | null = 0;

  if (usePrioritySort) {
    const { data: allRows, error, count: totalCount } = await query.limit(PRIORITY_SORT_MAX);
    if (error) {
      console.error("[listAdminOrders]", error.message);
      return { items: [], total: 0, page, perPage, pendingCount: 0 };
    }
    const sorted = sortOrdersByPriority(((allRows ?? []) as unknown as RawOrder[]).map(mapListItem));
    count = totalCount ?? sorted.length;
    const from = (page - 1) * perPage;
    data = sorted.slice(from, from + perPage);
  } else {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    const result = await query.range(from, to);
    if (result.error) {
      console.error("[listAdminOrders]", result.error.message);
      return { items: [], total: 0, page, perPage, pendingCount: 0 };
    }
    data = ((result.data ?? []) as unknown as RawOrder[]).map(mapListItem);
    count = result.count;
  }

  const { count: pendingCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .eq("payment_status", "unpaid");

  return {
    items: data as AdminOrderListItem[],
    total: count ?? 0,
    page,
    perPage,
    pendingCount: pendingCount ?? 0,
  };
}

export async function getAdminOrder(id: string): Promise<AdminOrderDetail | null> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      ${ORDER_SELECT},
      order_items (
        id, product_id, product_title, product_sku, brand_name,
        quantity, unit_price, subtotal
      ),
      order_status_history (
        id, from_status, to_status, note, created_at
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as Omit<RawOrder, "order_items"> & {
    order_items: RawOrderItem[] | null;
    order_status_history: RawHistory[] | null;
  };

  const lineItems: RawOrderItem[] = row.order_items ?? [];
  const base = mapListItem({ ...row, order_items: lineItems.map((i) => ({ id: i.id })) });
  const productIds = lineItems.map((i) => i.product_id);
  const images = await fetchProductImages(productIds);

  const items: AdminOrderLineItem[] = lineItems.map((item) => ({
    id: item.id,
    productId: item.product_id,
    productTitle: item.product_title,
    productSku: item.product_sku,
    brandName: item.brand_name,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    subtotal: item.subtotal,
    imageUrl: images.get(item.product_id) ?? null,
  }));

  const history: AdminOrderHistoryEntry[] = (row.order_status_history ?? [])
    .map((h) => ({
      id: h.id,
      fromStatus: h.from_status,
      toStatus: h.to_status,
      note: h.note,
      createdAt: h.created_at,
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const operational = parseOperationalMetadata(row.admin_internal_note);

  return {
    ...base,
    notes: row.notes,
    subtotal: row.subtotal,
    shippingCost: row.shipping_cost,
    deliveryMethod: row.delivery_method,
    fulfillmentStatus: row.fulfillment_status,
    reviewedAt: row.reviewed_at,
    customerMessage: row.customer_message,
    adminInternalNote: row.admin_internal_note,
    stripePaymentUrl: row.stripe_payment_url,
    stripePaidAt: row.stripe_paid_at,
    paymentMethod: row.payment_method,
    paymentRequestedAt: row.payment_requested_at,
    preparedAt: row.prepared_at,
    readyForPickupAt: row.ready_for_pickup_at,
    deliveredAt: row.delivered_at,
    pickupReadyMessage: row.pickup_ready_message,
    pickupReadyEstimate: row.pickup_ready_estimate,
    items,
    history,
    operational,
    legacyAdminNote: operational.legacyAdminNote ?? null,
    confirmedFinalPrice: operational.finalPrice?.amount ?? null,
    confirmedFinalPriceNote: operational.finalPrice?.note ?? null,
    confirmedFinalPriceAt: operational.finalPrice?.confirmedAt ?? null,
    warrantyLabel: warrantyDisplayLabel(operational.warranty),
    paymentMethodConfirmed: isPaymentMethodConfirmed(operational),
    paymentInstructionsSent: Boolean(operational.paymentMethodConfirmed?.instructionsSent),
    canValidatePayment: canValidateManualPayment(operational),
  };
}
