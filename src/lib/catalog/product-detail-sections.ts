import type { CatalogProduct } from "@/lib/catalog/types";

/** Convierte texto multilínea del admin en líneas útiles para la UI. */
export function parseDetailLines(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

/** Secciones de detalle para PDP y comparador. */
export function getProductDetailSections(product: CatalogProduct) {
  const includesFromSpecs = product.specs.filter((s) => /incluye/i.test(s.label));
  const restSpecs = product.specs.filter((s) => !/incluye/i.test(s.label));
  const midpoint = Math.ceil(restSpecs.length / 2);

  const specLines = parseDetailLines(product.specifications);
  const featureLines = parseDetailLines(product.features);
  const includeLines = parseDetailLines(product.includes);

  return {
    description: product.description?.trim() || product.subtitle?.trim() || null,
    specifications:
      specLines.length > 0
        ? specLines
        : restSpecs.slice(0, midpoint).map((s) => `${s.label}: ${s.value}`),
    features:
      featureLines.length > 0
        ? featureLines
        : restSpecs.slice(midpoint).map((s) => `${s.label}: ${s.value}`),
    includes:
      includeLines.length > 0
        ? includeLines
        : includesFromSpecs.map((s) => (s.value ? `${s.label}: ${s.value}` : s.label)),
  };
}
