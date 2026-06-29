import { ProductosPage } from "@/components/pages/productos-page";
import { getCatalogProducts } from "@/lib/catalog";
import { getActiveTaxonomyNames } from "@/lib/catalog/queries";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Productos",
  description:
    "Catálogo completo de instrumentos musicales y audio profesional: guitarras, baterías, teclados, mezcladoras y más.",
};

export default async function ProductosRoute() {
  const [products, activeTaxonomy] = await Promise.all([
    getCatalogProducts(),
    getActiveTaxonomyNames(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center pt-28 text-muted-foreground">
          Cargando catálogo…
        </div>
      }
    >
      <ProductosPage
        products={products}
        activeCategoryNames={activeTaxonomy.categoryNames}
        activeSubcategoryNames={activeTaxonomy.subcategoryNames}
      />
    </Suspense>
  );
}
