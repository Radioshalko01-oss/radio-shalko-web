/**
 * Email al cliente con datos bancarios oficiales · C.1 (opcional · Resend).
 */
import { formatPrice } from "@/lib/catalog/format";
import {
  BANK_TRANSFER_DETAILS,
  bankTransferDetailsText,
} from "@/lib/orders/operational-metadata";

export type CustomerPaymentInstructionsEmailPayload = {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  amount: number;
};

export function isCustomerPaymentInstructionsEmailEnabled(): boolean {
  return (
    process.env.CUSTOMER_ORDER_EMAILS_ENABLED?.trim().toLowerCase() === "true" &&
    Boolean(
      process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim(),
    )
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPlainText(payload: CustomerPaymentInstructionsEmailPayload): string {
  return [
    `Hola ${payload.customerName},`,
    "",
  bankTransferDetailsText(payload.orderNumber, payload.amount),
    "",
    "Radio Shalko",
  ].join("\n");
}

function buildHtml(payload: CustomerPaymentInstructionsEmailPayload): string {
  const rows = [
    ["Banco", BANK_TRANSFER_DETAILS.bank],
    ["Titular", BANK_TRANSFER_DETAILS.holder],
    ["Cuenta", BANK_TRANSFER_DETAILS.account],
    ["Tarjeta", BANK_TRANSFER_DETAILS.card],
    ["CLABE", BANK_TRANSFER_DETAILS.clabe],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 8px 4px 0;color:#71717a">${escapeHtml(label)}</td><td style="padding:4px 0"><strong>${escapeHtml(value)}</strong></td></tr>`,
    )
    .join("");

  return `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#18181b;max-width:560px">
      <h2 style="font-size:18px;margin:0 0 12px">Instrucciones de pago · ${escapeHtml(payload.orderNumber)}</h2>
      <p style="margin:0 0 16px;color:#52525b">Hola ${escapeHtml(payload.customerName)}, estos son los datos oficiales para tu transferencia.</p>
      <p style="margin:0 0 12px;font-size:14px">Monto a transferir: <strong>${formatPrice(payload.amount)}</strong></p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">${rows}</table>
      <p style="margin:0;font-size:13px;color:#71717a">Realiza tu transferencia únicamente a estos datos y comparte tu comprobante por el canal oficial de Radio Shalko.</p>
    </div>
  `.trim();
}

export async function sendCustomerPaymentInstructionsEmail(
  payload: CustomerPaymentInstructionsEmailPayload,
): Promise<{ sent: boolean; reason?: string }> {
  if (!isCustomerPaymentInstructionsEmailEnabled()) {
    return { sent: false, reason: "not_enabled" };
  }

  const from = process.env.EMAIL_FROM!.trim();
  const apiKey = process.env.RESEND_API_KEY!.trim();
  const subject = `Instrucciones de pago · Pedido ${payload.orderNumber}`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.customerEmail.trim()],
      subject,
      text: buildPlainText(payload),
      html: buildHtml(payload),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.warn("[sendCustomerPaymentInstructionsEmail] Resend error:", response.status, body);
    return { sent: false, reason: "provider_error" };
  }

  return { sent: true };
}

export async function notifyCustomerPaymentInstructions(
  payload: CustomerPaymentInstructionsEmailPayload,
): Promise<void> {
  try {
    await sendCustomerPaymentInstructionsEmail(payload);
  } catch (err) {
    console.warn("[notifyCustomerPaymentInstructions]", err);
  }
}
