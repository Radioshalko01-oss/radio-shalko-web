import { validatePurchaseRequestForm } from "@/lib/checkout/validate";
import type { CheckoutFormState } from "@/lib/checkout/types";
import type { CatalogProduct } from "@/lib/catalog/types";
import type { QuoteItemDTO } from "@/lib/quotes/actions";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  const n = Math.floor(value);
  return n < 1 ? 1 : n;
}

export function sanitizeCartItems(items: QuoteItemDTO[]): QuoteItemDTO[] {
  const map = new Map<string, number>();
  for (const item of items) {
    if (!item?.productId || !UUID_RE.test(item.productId)) continue;
    map.set(item.productId, clampQuantity(item.quantity));
  }
  return Array.from(map, ([productId, quantity]) => ({ productId, quantity }));
}

export function validateOrderCart(
  cartItems: QuoteItemDTO[],
  products: CatalogProduct[],
): { ok: true; lines: OrderValidatedLine[] } | { ok: false; error: string; fieldErrors?: Record<string, string> } {
  const items = sanitizeCartItems(cartItems);

  if (!items.length) {
    return { ok: false, error: "Tu carrito está vacío.", fieldErrors: { cart: "Tu carrito está vacío." } };
  }

  const byId = new Map(products.map((p) => [p.id, p]));
  const lines: OrderValidatedLine[] = [];

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) {
      return {
        ok: false,
        error: "Uno o más productos ya no están disponibles.",
        fieldErrors: { cart: "Uno o más productos ya no están disponibles. Revisa tu carrito." },
      };
    }

    if (!product.isPublished) {
      return {
        ok: false,
        error: `${product.name} ya no está disponible.`,
        fieldErrors: { cart: `${product.name} ya no está disponible.` },
      };
    }

    if (product.price < 0 || !Number.isFinite(product.price)) {
      return {
        ok: false,
        error: "Precio inválido en el carrito.",
        fieldErrors: { cart: "Hay un producto con precio inválido. Actualiza tu carrito." },
      };
    }

    if (!Number.isFinite(item.quantity) || item.quantity < 1) {
      return {
        ok: false,
        error: "Cantidad inválida en el carrito.",
        fieldErrors: { cart: "Hay una cantidad inválida en tu carrito." },
      };
    }

    lines.push({
      product,
      quantity: item.quantity,
      unitPrice: product.price,
      subtotal: product.price * item.quantity,
    });
  }

  return { ok: true, lines };
}

export type OrderValidatedLine = {
  product: CatalogProduct;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export function validateOrderForm(
  form: CheckoutFormState,
  hasCartItems: boolean,
): ReturnType<typeof validatePurchaseRequestForm> {
  return validatePurchaseRequestForm(form, hasCartItems);
}
