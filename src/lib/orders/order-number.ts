/** Formato de número de pedido Radio Shalko: RS-YYYY-NNNNNN */

const ORDER_NUMBER_RE = /^RS-(\d{4})-(\d{6})$/;

export function formatOrderNumber(year: number, sequence: number): string {
  return `RS-${year}-${String(sequence).padStart(6, "0")}`;
}

export function parseOrderNumber(orderNumber: string): { year: number; sequence: number } | null {
  const match = ORDER_NUMBER_RE.exec(orderNumber);
  if (!match) return null;
  return { year: Number(match[1]), sequence: Number(match[2]) };
}

/** La generación secuencial ocurre en SQL (create_order_from_checkout). */
export const ORDER_NUMBER_PREFIX = "RS";
