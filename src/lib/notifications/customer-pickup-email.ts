/**
 * Email al cliente cuando el pedido está listo para recoger · SALES-7 (opcional).
 */
import { formatPrice } from "@/lib/catalog/format";
import { siteBaseUrl } from "@/lib/stripe/client";

export type CustomerPickupEmailPayload = {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  branchLabel: string;
  total: number;
  pickupMessage: string;
  pickupEstimate: string | null;
  items: Array<{ title: string; quantity: number }>;
};

function orderDetailUrl(orderId: string): string {
  return `${siteBaseUrl()}/cuenta/pedidos/${orderId}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPlainText(payload: CustomerPickupEmailPayload): string {
  const lines = [
    `Hola ${payload.customerName},`,
    "",
    `Tu pedido ${payload.orderNumber} está listo para recoger.`,
    "",
    `Sucursal: ${payload.branchLabel}`,
    `Total: ${formatPrice(payload.total)}`,
    "",
    payload.pickupMessage.trim(),
  ];
  if (payload.pickupEstimate?.trim()) {
    lines.push("", payload.pickupEstimate.trim());
  }
  lines.push("", `Ver detalle: ${orderDetailUrl(payload.orderId)}`, "", "Radio Shalko");
  return lines.join("\n");
}

function buildHtml(payload: CustomerPickupEmailPayload): string {
  const itemsHtml = payload.items
    .slice(0, 5)
    .map((item) => `<li>${escapeHtml(item.title)} · ${item.quantity} uds</li>`)
    .join("");
  const estimateBlock = payload.pickupEstimate?.trim()
    ? `<p style="margin:8px 0 0;font-size:14px;color:#52525b">${escapeHtml(payload.pickupEstimate.trim())}</p>`
    : "";

  return `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#18181b;max-width:560px">
      <h2 style="font-size:18px;margin:0 0 12px">Tu pedido ${escapeHtml(payload.orderNumber)} está listo para recoger</h2>
      <p style="margin:0 0 16px;color:#52525b">Hola ${escapeHtml(payload.customerName)}, ya puedes pasar por tu pedido.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
        <tr><td style="padding:4px 0;color:#71717a">Sucursal</td><td style="padding:4px 0"><strong>${escapeHtml(payload.branchLabel)}</strong></td></tr>
        <tr><td style="padding:4px 0;color:#71717a">Total</td><td style="padding:4px 0">${formatPrice(payload.total)}</td></tr>
      </table>
      <p style="margin:0;padding:12px;background:#f4f4f5;border-radius:8px;font-size:14px;line-height:1.5">${escapeHtml(payload.pickupMessage.trim())}</p>
      ${estimateBlock}
      ${itemsHtml ? `<p style="margin:16px 0 8px;font-size:14px;font-weight:600">Productos</p><ul style="margin:0 0 16px;padding-left:20px;font-size:14px">${itemsHtml}</ul>` : ""}
      <p style="margin:0">
        <a href="${orderDetailUrl(payload.orderId)}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:500">
          Ver mi pedido
        </a>
      </p>
    </div>
  `.trim();
}

export async function sendCustomerPickupEmail(
  payload: CustomerPickupEmailPayload,
): Promise<{ sent: boolean; reason?: string }> {
  const enabled =
    process.env.CUSTOMER_ORDER_EMAILS_ENABLED?.trim().toLowerCase() === "true" &&
    Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());

  if (!enabled) return { sent: false, reason: "not_enabled" };

  const from = process.env.EMAIL_FROM!.trim();
  const apiKey = process.env.RESEND_API_KEY!.trim();
  const subject = `Tu pedido ${payload.orderNumber} está listo para recoger`;

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
    console.warn("[sendCustomerPickupEmail] Resend error:", response.status, body);
    return { sent: false, reason: "provider_error" };
  }

  return { sent: true };
}

export async function notifyCustomerPickupReady(
  payload: CustomerPickupEmailPayload,
): Promise<void> {
  try {
    await sendCustomerPickupEmail(payload);
  } catch (err) {
    console.warn("[notifyCustomerPickupReady]", err);
  }
}
