import type { SupabaseClient } from "@supabase/supabase-js";
import type { CatalogSpec } from "@/lib/catalog/types";

/** Etiquetas internas en product_specs cuando aún no existen las columnas en products. */
export const DETAIL_SPEC_LABELS = {
  specifications: "_rs:specifications",
  features: "_rs:features",
  includes: "_rs:includes",
} as const;

const ALL_DETAIL_LABELS = Object.values(DETAIL_SPEC_LABELS);

export type DetailSectionText = {
  specifications: string | null;
  features: string | null;
  includes: string | null;
};

export function isDetailSpecLabel(label: string): boolean {
  return label.startsWith("_rs:");
}

/** Oculta specs internas de detalle en listados públicos. */
export function filterPublicSpecs(specs: CatalogSpec[]): CatalogSpec[] {
  return specs.filter((s) => !isDetailSpecLabel(s.label));
}

export function extractDetailSectionsFromSpecs(specs: CatalogSpec[]): DetailSectionText {
  const find = (label: string) => specs.find((s) => s.label === label)?.value ?? null;
  return {
    specifications: find(DETAIL_SPEC_LABELS.specifications),
    features: find(DETAIL_SPEC_LABELS.features),
    includes: find(DETAIL_SPEC_LABELS.includes),
  };
}

export function mergeDetailSections(
  fromColumns: DetailSectionText,
  fromSpecs: DetailSectionText,
): DetailSectionText {
  return {
    specifications: fromColumns.specifications ?? fromSpecs.specifications,
    features: fromColumns.features ?? fromSpecs.features,
    includes: fromColumns.includes ?? fromSpecs.includes,
  };
}

/** Persiste secciones de detalle en product_specs (fallback pre-migración). */
export async function syncDetailSectionsToSpecs(
  supabase: SupabaseClient,
  productId: string,
  sections: DetailSectionText,
): Promise<void> {
  await supabase
    .from("product_specs")
    .delete()
    .eq("product_id", productId)
    .in("label", ALL_DETAIL_LABELS);

  const rows: Array<{
    product_id: string;
    label: string;
    value: string;
    sort_order: number;
  }> = [];

  let order = 0;
  if (sections.specifications?.trim()) {
    rows.push({
      product_id: productId,
      label: DETAIL_SPEC_LABELS.specifications,
      value: sections.specifications.trim(),
      sort_order: order++,
    });
  }
  if (sections.features?.trim()) {
    rows.push({
      product_id: productId,
      label: DETAIL_SPEC_LABELS.features,
      value: sections.features.trim(),
      sort_order: order++,
    });
  }
  if (sections.includes?.trim()) {
    rows.push({
      product_id: productId,
      label: DETAIL_SPEC_LABELS.includes,
      value: sections.includes.trim(),
      sort_order: order++,
    });
  }

  if (rows.length) {
    await supabase.from("product_specs").insert(rows);
  }
}
