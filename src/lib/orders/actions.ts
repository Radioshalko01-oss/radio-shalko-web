"use server";

/**
 * SALES-2 · Crear solicitud de compra desde checkout (solo autenticado, pickup).
 */
import { PENDING_PAYMENT_METHOD, pickupStoreLabel } from "@/lib/checkout/constants";
import type { CheckoutFormState } from "@/lib/checkout/types";
import { getProductsByIds } from "@/lib/catalog/queries";
import { createClient } from "@/lib/supabase/server";
import type { QuoteItemDTO } from "@/lib/quotes/actions";
import type {
  CreateOrderResult,
  OrderLineSnapshot,
} from "@/lib/orders/types";
import {
  sanitizeCartItems,
  validateOrderCart,
  validateOrderForm,
} from "@/lib/orders/validators";
import { notifyAdminNewOrder } from "@/lib/notifications/internal-order-email";
import { notifyCustomer } from "@/lib/notifications/customer-notifications";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function rpcErrorMessage(code: string | undefined): string {
  switch (code) {
    case "authentication_required":
      return "Debes iniciar sesión para enviar tu solicitud.";
    case "empty_items":
      return "Tu carrito está vacío.";
    case "branch_required":
      return "Elige dónde quieres recoger tu pedido.";
    case "invalid_customer":
      return "Revisa tus datos de contacto.";
    case "invalid_delivery_method":
    case "invalid_payment_method":
    case "invalid_totals":
      return "Revisa la información de tu solicitud e intenta de nuevo.";
    default:
      return "No pudimos enviar tu solicitud. Intenta de nuevo en unos momentos.";
  }
}

async function resolveBranchId(branchSlug: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("branches")
    .select("id")
    .eq("slug", branchSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data.id;
}

export async function createOrderFromCart(
  form: CheckoutFormState,
  cartItems: QuoteItemDTO[],
): Promise<CreateOrderResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: "Debes iniciar sesión para enviar tu solicitud.",
      fieldErrors: { auth: "Inicia sesión para continuar." },
    };
  }

  const items = sanitizeCartItems(cartItems);

  const formResult = validateOrderForm(form, items.length > 0);
  if (!formResult.ok) {
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors: formResult.errors };
  }

  const productIds = items.map((i) => i.productId);
  const products = await getProductsByIds(productIds);
  const cartResult = validateOrderCart(items, products);
  if (!cartResult.ok) {
    return cartResult;
  }

  const branchId = await resolveBranchId(form.branchSlug);
  if (!branchId) {
    return {
      ok: false,
      error: "La sucursal seleccionada no está disponible.",
      fieldErrors: { branchSlug: "La sucursal seleccionada no está disponible." },
    };
  }

  const subtotal = cartResult.lines.reduce((acc, line) => acc + line.subtotal, 0);
  const total = subtotal;

  const orderItems: OrderLineSnapshot[] = cartResult.lines.map((line) => ({
    productId: line.product.id,
    productTitle: line.product.name,
    productSku: line.product.sku,
    brandName: line.product.brand?.name ?? null,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    subtotal: line.subtotal,
  }));

  const { data, error } = await supabase.rpc("create_order_from_checkout", {
    p_payload: {
      customer_email: form.contact.email.trim(),
      customer_name: form.contact.name.trim(),
      customer_phone: digitsOnly(form.contact.phone),
      delivery_method: "pickup",
      branch_id: branchId,
      payment_method: PENDING_PAYMENT_METHOD,
      subtotal,
      shipping_cost: 0,
      total,
      currency: "MXN",
      notes: form.contact.notes.trim() || null,
      items: orderItems.map((item) => ({
        product_id: item.productId,
        product_title: item.productTitle,
        product_sku: item.productSku,
        brand_name: item.brandName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
      })),
      address: null,
    },
  });

  if (error) {
    const hint = error.message?.split("\n")[0]?.trim() ?? error.code ?? "";
    return { ok: false, error: rpcErrorMessage(hint) };
  }

  const result = data as { id?: string; order_number?: string } | null;
  if (!result?.id || !result?.order_number) {
    return { ok: false, error: "No pudimos confirmar tu solicitud. Intenta de nuevo." };
  }

  void notifyAdminNewOrder({
    orderId: result.id,
    orderNumber: result.order_number,
    customerName: form.contact.name.trim(),
    customerEmail: form.contact.email.trim(),
    customerPhone: digitsOnly(form.contact.phone),
    branchLabel: pickupStoreLabel(form.branchSlug),
    total,
    items: orderItems.map((item) => ({
      title: item.productTitle,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
  });

  notifyCustomer({
    userId: user.id,
    type: "order_created",
    title: "Solicitud recibida",
    message: `Recibimos tu solicitud ${result.order_number}. Radio Shalko revisará la disponibilidad de tus productos.`,
    href: `/cuenta/pedidos/${result.id}`,
    orderId: result.id,
    metadata: { order_number: result.order_number },
  });

  return {
    ok: true,
    orderId: result.id,
    orderNumber: result.order_number,
    customerName: form.contact.name.trim(),
    total,
    branchDisplayName: pickupStoreLabel(form.branchSlug),
    statusLabel: "Solicitud recibida",
  };
}
