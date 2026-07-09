/**
 * Garantía por marca en PDP — extensible cuando se confirmen plazos oficiales.
 * Clave: nombre de marca tal como aparece en catálogo (case-insensitive).
 */
export type BrandWarrantyInfo = {
  /** Ej. "1 año" */
  duration: string;
  /** Texto corto bajo el título del bloque */
  summary: string;
};

const BRAND_WARRANTY: Record<string, BrandWarrantyInfo> = {
  casio: {
    duration: "1 año",
    summary: "Garantía directa con Radio Shalko contra defectos de fabricación.",
  },
};

const DEFAULT_WARRANTY: BrandWarrantyInfo = {
  duration: "Consultar",
  summary: "Cobertura según marca y producto. Confirma el plazo con un asesor.",
};

export function getBrandWarranty(brandName: string | null | undefined): BrandWarrantyInfo {
  if (!brandName) return DEFAULT_WARRANTY;
  const key = brandName.normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase();
  return BRAND_WARRANTY[key] ?? DEFAULT_WARRANTY;
}
