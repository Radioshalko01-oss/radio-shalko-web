/**
 * Metadata operativa de pedidos · almacenada en orders.admin_internal_note como JSON.
 * Sin migración: compatible con notas de texto plano previas.
 */

export const WARRANTY_OPTIONS = [
  "none",
  "1_month",
  "2_months",
  "3_months",
  "6_months",
  "1_year",
  "custom",
] as const;

export type WarrantyOption = (typeof WARRANTY_OPTIONS)[number];

export type WarrantyCustomUnit = "days" | "months" | "years";

export type OrderFinalPriceMeta = {
  amount: number;
  note?: string | null;
  confirmedAt: string;
  confirmedBy: string;
};

export type OrderWarrantyMeta = {
  type: WarrantyOption;
  noneReason?: string | null;
  customValue?: number | null;
  customUnit?: WarrantyCustomUnit | null;
  note?: string | null;
  definedAt: string;
  definedBy: string;
};

export type OrderPaymentMethodConfirmedMeta = {
  confirmedAt: string;
  confirmedBy: string;
  instructionsSent: boolean;
};

export type OrderOperationalMeta = {
  v: 1;
  finalPrice?: OrderFinalPriceMeta;
  warranty?: OrderWarrantyMeta;
  paymentMethodConfirmed?: OrderPaymentMethodConfirmedMeta;
  legacyAdminNote?: string | null;
};

type StoredPayload = { rsOp: OrderOperationalMeta };

const META_PREFIX = '{"rsOp":';

export function isOperationalMetadata(raw: string | null | undefined): boolean {
  if (!raw?.trim()) return false;
  return raw.trim().startsWith(META_PREFIX);
}

export function parseOperationalMetadata(raw: string | null | undefined): OrderOperationalMeta {
  if (!raw?.trim()) return { v: 1 };
  const trimmed = raw.trim();
  if (trimmed.startsWith(META_PREFIX)) {
    try {
      const parsed = JSON.parse(trimmed) as StoredPayload;
      if (parsed?.rsOp?.v === 1) {
        return {
          v: 1,
          finalPrice: parsed.rsOp.finalPrice,
          warranty: parsed.rsOp.warranty,
          paymentMethodConfirmed: parsed.rsOp.paymentMethodConfirmed,
          legacyAdminNote: parsed.rsOp.legacyAdminNote ?? null,
        };
      }
    } catch {
      /* fall through */
    }
  }
  return { v: 1, legacyAdminNote: trimmed };
}

export function serializeOperationalMetadata(meta: OrderOperationalMeta): string {
  const payload: StoredPayload = {
    rsOp: {
      v: 1,
      finalPrice: meta.finalPrice,
      warranty: meta.warranty,
      paymentMethodConfirmed: meta.paymentMethodConfirmed,
      legacyAdminNote: meta.legacyAdminNote?.trim() || null,
    },
  };
  return JSON.stringify(payload);
}

export function mergeOperationalMetadata(
  raw: string | null | undefined,
  patch: Partial<OrderOperationalMeta>,
): OrderOperationalMeta {
  const current = parseOperationalMetadata(raw);
  return {
    ...current,
    ...patch,
    v: 1,
  };
}

export function isFinalPriceConfirmed(meta: OrderOperationalMeta): boolean {
  return Boolean(meta.finalPrice?.confirmedAt && meta.finalPrice.amount > 0);
}

export function isWarrantyDefined(meta: OrderOperationalMeta): boolean {
  if (!meta.warranty?.definedAt) return false;
  if (meta.warranty.type === "none") {
    return Boolean(meta.warranty.noneReason?.trim());
  }
  if (meta.warranty.type === "custom") {
    return Boolean(
      meta.warranty.customValue &&
        meta.warranty.customValue > 0 &&
        meta.warranty.customUnit,
    );
  }
  return WARRANTY_OPTIONS.includes(meta.warranty.type);
}

export function isPaymentMethodConfirmed(meta: OrderOperationalMeta): boolean {
  return Boolean(meta.paymentMethodConfirmed?.confirmedAt);
}

export function canValidateManualPayment(meta: OrderOperationalMeta): boolean {
  return (
    isFinalPriceConfirmed(meta) &&
    isWarrantyDefined(meta) &&
    isPaymentMethodConfirmed(meta)
  );
}

const WARRANTY_LABELS: Record<Exclude<WarrantyOption, "custom" | "none">, string> = {
  "1_month": "1 mes",
  "2_months": "2 meses",
  "3_months": "3 meses",
  "6_months": "6 meses",
  "1_year": "1 año",
};

/** Copy sugerido en admin para restricciones por higiene u otros casos especiales. */
export const WARRANTY_HYGIENE_SUGGESTED_COPY =
  "Por higiene, este producto no cuenta con cambios o devoluciones una vez entregado, salvo defecto de fabricación o falla atribuible al producto.";

export const WARRANTY_NONE_CUSTOMER_HEADING = "Restricción especial de garantía";

export function isHygieneRelatedWarrantyReason(reason: string): boolean {
  return /higiene|sanitar|sellado|devoluc|intercambio|cambio/i.test(reason);
}

function formatWarrantyWithNote(base: string, note?: string | null): string {
  return note?.trim() ? `${base} · ${note.trim()}` : base;
}

/** Etiqueta para admin (incluye “No aplica garantía” cuando type = none). */
export function warrantyDisplayLabel(warranty?: OrderWarrantyMeta | null): string | null {
  if (!warranty?.definedAt) return null;
  if (warranty.type === "none") {
    const reason = warranty.noneReason?.trim();
    return reason ? `No aplica garantía · ${reason}` : "No aplica garantía";
  }
  if (warranty.type === "custom") {
    const value = warranty.customValue;
    const unit = warranty.customUnit;
    if (!value || !unit) return "Garantía personalizada";
    const unitLabel =
      unit === "days" ? "días" : unit === "months" ? "meses" : "años";
    const base = `Garantía personalizada · ${value} ${unitLabel}`;
    return formatWarrantyWithNote(base, warranty.note);
  }
  const label = WARRANTY_LABELS[warranty.type as keyof typeof WARRANTY_LABELS];
  if (!label) return null;
  return formatWarrantyWithNote(label, warranty.note);
}

/** Etiqueta visible al cliente (type none → “Restricción especial de garantía”). */
export function warrantyCustomerDisplayLabel(
  warranty?: OrderWarrantyMeta | null,
): string | null {
  if (!warranty?.definedAt) return null;
  if (warranty.type === "none") {
    const reason = warranty.noneReason?.trim();
    if (reason && isHygieneRelatedWarrantyReason(reason)) {
      return `${WARRANTY_NONE_CUSTOMER_HEADING} · ${WARRANTY_HYGIENE_SUGGESTED_COPY}`;
    }
    return reason
      ? `${WARRANTY_NONE_CUSTOMER_HEADING} · ${reason}`
      : WARRANTY_NONE_CUSTOMER_HEADING;
  }
  return warrantyDisplayLabel(warranty);
}

export const BANK_TRANSFER_DETAILS = {
  bank: "Santander",
  holder: "Verónica Valdivia Herrera",
  account: "6056596203",
  card: "5579070137322544",
  clabe: "01418060565962032",
} as const;

export function bankTransferDetailsText(orderNumber: string, amount: number): string {
  const amountFormatted = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(amount);

  return [
    `Datos bancarios oficiales · Pedido ${orderNumber}`,
    "",
    `Monto a transferir: ${amountFormatted}`,
    `Banco: ${BANK_TRANSFER_DETAILS.bank}`,
    `Titular: ${BANK_TRANSFER_DETAILS.holder}`,
    `Cuenta: ${BANK_TRANSFER_DETAILS.account}`,
    `Tarjeta: ${BANK_TRANSFER_DETAILS.card}`,
    `CLABE: ${BANK_TRANSFER_DETAILS.clabe}`,
    "",
    "Realiza tu transferencia únicamente a estos datos oficiales y comparte tu comprobante por el canal que Radio Shalko te indique.",
  ].join("\n");
}

export function bankTransferWhatsAppMessage(
  orderNumber: string,
  amount: number,
  customerName: string,
): string {
  return `Hola ${customerName}, te contacto de Radio Shalko sobre tu pedido ${orderNumber}.

${bankTransferDetailsText(orderNumber, amount)}`;
}

/** Datos bancarios para vista cliente (sin tarjeta). */
export function customerBankTransferLines(): Array<{ label: string; value: string }> {
  return [
    { label: "Banco", value: BANK_TRANSFER_DETAILS.bank },
    { label: "Titular", value: BANK_TRANSFER_DETAILS.holder },
    { label: "Cuenta", value: BANK_TRANSFER_DETAILS.account },
    { label: "CLABE", value: BANK_TRANSFER_DETAILS.clabe },
  ];
}

export function customerBankTransferDetailsText(orderNumber: string): string {
  const lines = customerBankTransferLines().map((row) => `${row.label}: ${row.value}`);
  return [`Datos para transferencia · ${orderNumber}`, "", ...lines].join("\n");
}

export function customerTransferReceiptWhatsAppMessage(orderNumber: string): string {
  return `Hola, envío comprobante de transferencia para mi solicitud ${orderNumber}.`;
}
