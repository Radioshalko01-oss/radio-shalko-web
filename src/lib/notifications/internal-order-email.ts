/**
 * Notificaciones internas por email · SALES-5.
 *
 * Capa preparada para Resend. Solo envía si están configuradas:
 *   ADMIN_ORDER_NOTIFICATION_EMAIL
 *   EMAIL_FROM
 *   RESEND_API_KEY
 *
 * Fallos de email nunca bloquean la creación del pedido.
 */
import { formatPrice } from "@/lib/catalog/format";

export type AdminNewOrderEmailPayload = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  branchLabel: string;
  total: number;
  items: Array<{ title: string; quantity: number; subtotal: number }>;
};

export function isAdminOrderEmailConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_ORDER_NOTIFICATION_EMAIL?.trim() &&
      process.env.EMAIL_FROM?.trim() &&
      process.env.RESEND_API_KEY?.trim(),
  );
}

function adminOrderDetailUrl(orderId: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/admin/pedidos/${orderId}`;
}

function buildPlainText(payload: AdminNewOrderEmailPayload): string {
  const lines = [
    "Nueva solicitud de compra en Radio Shalko",
    "",
    `Pedido: ${payload.orderNumber}`,
    `Cliente: ${payload.customerName}`,
    `Teléfono: ${payload.customerPhone}`,
    `Correo: ${payload.customerEmail}`,
    `Recolección: ${payload.branchLabel}`,
    `Total estimado: ${formatPrice(payload.total)}`,
    "",
    "Productos:",
    ...payload.items.map(
      (item, i) =>
        `${i + 1}. ${item.title} · ${item.quantity} uds · ${formatPrice(item.subtotal)}`,
    ),
    "",
    `Ver detalle: ${adminOrderDetailUrl(payload.orderId)}`,
  ];
  return lines.join("\n");
}

function buildHtml(payload: AdminNewOrderEmailPayload): string {
  const itemsHtml = payload.items
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.title)}</strong> · ${item.quantity} uds · ${formatPrice(item.subtotal)}</li>`,
    )
    .join("");

  return `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#18181b;max-width:560px">
      <h2 style="font-size:18px;margin:0 0 12px">Nueva solicitud de compra</h2>
      <p style="margin:0 0 16px;color:#52525b">Se recibió una solicitud desde el checkout.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:4px 0;color:#71717a">Pedido</td><td style="padding:4px 0"><strong>${escapeHtml(payload.orderNumber)}</strong></td></tr>
        <tr><td style="padding:4px 0;color:#71717a">Cliente</td><td style="padding:4px 0">${escapeHtml(payload.customerName)}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a">Teléfono</td><td style="padding:4px 0">${escapeHtml(payload.customerPhone)}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a">Correo</td><td style="padding:4px 0">${escapeHtml(payload.customerEmail)}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a">Recolección</td><td style="padding:4px 0">${escapeHtml(payload.branchLabel)}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a">Total estimado</td><td style="padding:4px 0"><strong>${formatPrice(payload.total)}</strong></td></tr>
      </table>
      <p style="margin:16px 0 8px;font-size:14px;font-weight:600">Productos</p>
      <ul style="margin:0 0 16px;padding-left:20px;font-size:14px">${itemsHtml}</ul>
      <p style="margin:0">
        <a href="${adminOrderDetailUrl(payload.orderId)}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:500">
          Revisar pedido
        </a>
      </p>
    </div>
  `.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Envía email interno vía Resend REST. No-op si no hay configuración. */
export async function sendAdminNewOrderEmail(
  payload: AdminNewOrderEmailPayload,
): Promise<{ sent: boolean; reason?: string }> {
  if (!isAdminOrderEmailConfigured()) {
    return { sent: false, reason: "not_configured" };
  }

  const to = process.env.ADMIN_ORDER_NOTIFICATION_EMAIL!.trim();
  const from = process.env.EMAIL_FROM!.trim();
  const apiKey = process.env.RESEND_API_KEY!.trim();
  const subject = `Nueva solicitud de compra ${payload.orderNumber}`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text: buildPlainText(payload),
      html: buildHtml(payload),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.warn("[sendAdminNewOrderEmail] Resend error:", response.status, body);
    return { sent: false, reason: "provider_error" };
  }

  return { sent: true };
}

/** Fire-and-forget seguro: nunca lanza al caller. */
export async function notifyAdminNewOrder(payload: AdminNewOrderEmailPayload): Promise<void> {
  try {
    await sendAdminNewOrderEmail(payload);
  } catch (err) {
    console.warn("[notifyAdminNewOrder]", err);
  }
}
