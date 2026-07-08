import type { CheckoutFormState, CheckoutValidationResult } from "@/lib/checkout/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Validación cliente/servidor · SALES-2 solicitud pickup. */
export function validatePurchaseRequestForm(
  form: CheckoutFormState,
  hasCartItems: boolean,
): CheckoutValidationResult {
  const errors: Record<string, string> = {};

  if (!hasCartItems) {
    errors.cart = "Tu carrito está vacío.";
  }

  const name = form.contact.name.trim();
  if (name.length < 2) {
    errors.contactName = "Ingresa tu nombre completo.";
  }

  const email = form.contact.email.trim();
  if (!email || !EMAIL_RE.test(email)) {
    errors.contactEmail = "Ingresa un correo electrónico válido.";
  }

  const phone = digitsOnly(form.contact.phone);
  if (phone.length < 10) {
    errors.contactPhone = "Ingresa un teléfono de 10 dígitos.";
  }

  if (!form.paymentMethod) {
    errors.paymentMethod = "Elige cómo prefieres pagar.";
  }

  if (!form.branchSlug) {
    errors.branchSlug = "Elige en qué tienda prefieres recoger tu producto.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true };
}

/** @deprecated Usar validatePurchaseRequestForm (SALES-2). */
export function validateCheckoutForm(
  form: CheckoutFormState,
  hasCartItems: boolean,
): CheckoutValidationResult {
  return validatePurchaseRequestForm(form, hasCartItems);
}
