import { MarcasPage } from "@/components/pages/marcas-page";
import { getCatalogProducts } from "@/lib/catalog";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Marcas",
  description:
    "Distribuidor autorizado: Fender, Gibson, Yamaha, Roland, Shure y más.",
};

export default async function MarcasRoute() {
  const products = await getCatalogProducts();

  return (
    <Suspense fallback={<div className="pt-28 text-center text-muted-foreground">Cargando…</div>}>
      <MarcasPage products={products} />
    </Suspense>
  );
}
