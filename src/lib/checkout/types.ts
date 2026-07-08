/** Tipos del checkout · ORDER-3 (UI únicamente). */

export type DeliveryMethod = "pickup" | "local_delivery" | "national_shipping";

export type PaymentMethod = "mercado_pago" | "bank_transfer" | "pay_in_store";

export type BranchSlug = "chalco" | "amecameca";

export type CheckoutContact = {
  name: string;
  email: string;
  phone: string;
  notes: string;
};

export type CheckoutLocalAddress = {
  street: string;
  neighborhood: string;
  postalCode: string;
};

export type CheckoutNationalAddress = {
  recipientName: string;
  recipientPhone: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
};

export type CheckoutFormState = {
  contact: CheckoutContact;
  deliveryMethod: DeliveryMethod;
  branchSlug: BranchSlug | "";
  localAddress: CheckoutLocalAddress;
  nationalAddress: CheckoutNationalAddress;
  paymentMethod: "bank_transfer" | "pay_in_store" | "";
};

export type CheckoutValidationResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string> };
