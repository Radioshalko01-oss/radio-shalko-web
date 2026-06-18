import { MarcasPage } from "@/components/pages/marcas-page";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Marcas",
  description:
    "Distribuidor autorizado: Fender, Gibson, Yamaha, Roland, Shure y más.",
};

export default function MarcasRoute() {
  return (
    <Suspense fallback={<div className="pt-28 text-center text-muted-foreground">Cargando…</div>}>
      <MarcasPage />
    </Suspense>
  );
}
