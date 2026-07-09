/** Precio en pesos mexicanos, sin decimales. Redondea para evitar artefactos (ej. $7,5355). */
export const formatPrice = (n: number): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(n));

/**
 * Convierte un texto a slug seguro para URL:
 * minúsculas, sin acentos, separado por guiones.
 * Útil para generar slugs de producto en B5 (import) y validar en admin.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
