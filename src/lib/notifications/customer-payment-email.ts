/**
 * Email al cliente con instrucciones de pago · SALES-6 (opcional).
 *
 * Solo envía si están configuradas:
 *   RESEND_API_KEY, EMAIL_FROM, CUSTOMER_ORDER_EMAILS_ENABLED=true
 *
 * Fallos nunca bloquean el flujo de pedido.
 */
import { formatPrice } from "@/lib/catalog/format";

export type CustomerPaymentEmailPayload = {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  branchLabel: string;
  total: number;
  customerMessage: string | null;
  paymentUrl?: string;
};

export function isCustomerPaymentEmailEnabled(): boolean {
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

function buildPlainText(payload: CustomerPaymentEmailPayload): string {
  const lines = [
    `Hola ${payload.customerName},`,
    "",
    `Tu pedido ${payload.orderNumber} fue aprobado.`,
    "",
    `Total: ${formatPrice(payload.total)}`,
    `Recolección: ${payload.branchLabel}`,
  ];
  if (payload.customerMessage?.trim()) {
    lines.push("", payload.customerMessage.trim());
  }
  lines.push(
    "",
    "Radio Shalko te compartirá las instrucciones oficiales de pago por transferencia bancaria o pago presencial en tienda (Chalco o Amecameca).",
    "",
    "No realices pagos fuera de los canales oficiales hasta recibir nuestra confirmación.",
    "",
    "Radio Shalko",
  );
  return lines.join("\n");
}

function buildHtml(payload: CustomerPaymentEmailPayload): string {
  const messageBlock = payload.customerMessage?.trim()
    ? `<p style="margin:16px 0;padding:12px;background:#f4f4f5;border-radius:8px;font-size:14px;line-height:1.5">${escapeHtml(payload.customerMessage.trim())}</p>`
    : "";

  return `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#18181b;max-width:560px">
      <h2 style="font-size:18px;margin:0 0 12px">Tu pedido ${escapeHtml(payload.orderNumber)} fue aprobado</h2>
      <p style="margin:0 0 16px;color:#52525b">Hola ${escapeHtml(payload.customerName)}, tu solicitud puede avanzar al pago.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
        <tr><td style="padding:4px 0;color:#71717a">Total</td><td style="padding:4px 0"><strong>${formatPrice(payload.total)}</strong></td></tr>
        <tr><td style="padding:4px 0;color:#71717a">Recolección</td><td style="padding:4px 0">${escapeHtml(payload.branchLabel)}</td></tr>
      </table>
      ${messageBlock}
      <p style="margin:0 0 16px;font-size:14px;line-height:1.5">
        Te contactaremos con las instrucciones oficiales de pago por <strong>transferencia bancaria</strong> o <strong>pago presencial en tienda</strong> (Chalco o Amecameca).
      </p>
      <p style="margin:0;font-size:12px;color:#71717a">No hay pago automático en línea. No deposites ni pagues hasta recibir nuestra confirmación.</p>
    </div>
  `.trim();
}

export async function sendCustomerPaymentEmail(
  payload: CustomerPaymentEmailPayload,
): Promise<{ sent: boolean; reason?: string }> {
  if (!isCustomerPaymentEmailEnabled()) {
    return { sent: false, reason: "not_enabled" };
  }

  const from = process.env.EMAIL_FROM!.trim();
  const apiKey = process.env.RESEND_API_KEY!.trim();
  const subject = `Tu pedido ${payload.orderNumber} fue aprobado`;

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
    console.warn("[sendCustomerPaymentEmail] Resend error:", response.status, body);
    return { sent: false, reason: "provider_error" };
  }

  return { sent: true };
}

export async function notifyCustomerPaymentLink(
  payload: CustomerPaymentEmailPayload,
): Promise<void> {
  try {
    await sendCustomerPaymentEmail(payload);
  } catch (err) {
    console.warn("[notifyCustomerPaymentLink]", err);
  }
}
