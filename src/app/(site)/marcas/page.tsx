import { MarcasPage } from "@/components/pages/marcas-page";
import { getCatalogProducts } from "@/lib/catalog";
import { getBrands } from "@/lib/catalog/queries";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Marcas",
  description:
    "Distribuidor autorizado: Casio, Yamaha, Ibanez, Fender, Behringer, McCartney y más.",
};

export default async function MarcasRoute() {
  const [products, activeBrands] = await Promise.all([
    getCatalogProducts(),
    getBrands({ activeOnly: true }),
  ]);
  const brandNames = activeBrands.map((b) => b.name);

  return (
    <Suspense fallback={<div className="pt-28 text-center text-muted-foreground">Cargando…</div>}>
      <MarcasPage products={products} brandNames={brandNames} />
    </Suspense>
  );
}
