/**
 * Emails opcionales ligados a eventos de notificación · SALES-7.2.
 */
import { siteBaseUrl } from "@/lib/stripe/client";

function isEnabled(): boolean {
  return (
    process.env.CUSTOMER_ORDER_EMAILS_ENABLED?.trim().toLowerCase() === "true" &&
    Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim())
  );
}

async function sendEmail(to: string, subject: string, text: string, html: string) {
  const from = process.env.EMAIL_FROM!.trim();
  const apiKey = process.env.RESEND_API_KEY!.trim();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to.trim()], subject, text, html }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.warn("[customer-email-events] Resend error:", response.status, body);
  }
}

export async function notifyCustomerPaymentConfirmedEmail(payload: {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  orderId: string;
}): Promise<void> {
  if (!isEnabled()) return;

  const url = `${siteBaseUrl()}/cuenta/pedidos/${payload.orderId}`;
  const subject = `Pago confirmado para tu pedido ${payload.orderNumber}`;
  const text = [
    `Hola ${payload.customerName},`,
    "",
    `Recibimos el pago de tu pedido ${payload.orderNumber}.`,
    "",
    `Ver detalle: ${url}`,
    "",
    "Radio Shalko",
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#18181b;max-width:560px">
      <h2 style="font-size:18px;margin:0 0 12px">Pago confirmado</h2>
      <p style="margin:0 0 16px;color:#52525b">Hola ${payload.customerName}, recibimos el pago de tu pedido <strong>${payload.orderNumber}</strong>.</p>
      <p style="margin:0"><a href="${url}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:500">Ver mi pedido</a></p>
    </div>
  `.trim();

  try {
    await sendEmail(payload.customerEmail, subject, text, html);
  } catch (err) {
    console.warn("[notifyCustomerPaymentConfirmedEmail]", err);
  }
}

export async function notifyCustomerCartReminderEmail(payload: {
  customerEmail: string;
  customerName: string;
  itemCount: number;
}): Promise<void> {
  if (!isEnabled()) return;

  const url = `${siteBaseUrl()}/carrito`;
  const subject = "Tus productos siguen guardados en Radio Shalko";
  const text = [
    `Hola ${payload.customerName},`,
    "",
    `Tienes ${payload.itemCount} producto${payload.itemCount === 1 ? "" : "s"} en tu carrito.`,
    "Tus productos siguen guardados. Puedes revisarlos cuando quieras.",
    "",
    `Ver carrito: ${url}`,
    "",
    "La disponibilidad se confirma al enviar solicitud.",
    "",
    "Radio Shalko",
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#18181b;max-width:560px">
      <h2 style="font-size:18px;margin:0 0 12px">Tus productos siguen guardados</h2>
      <p style="margin:0 0 16px;color:#52525b">Tienes ${payload.itemCount} producto${payload.itemCount === 1 ? "" : "s"} esperando en tu carrito.</p>
      <p style="margin:0"><a href="${url}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:500">Ver carrito</a></p>
    </div>
  `.trim();

  try {
    await sendEmail(payload.customerEmail, subject, text, html);
  } catch (err) {
    console.warn("[notifyCustomerCartReminderEmail]", err);
  }
}
