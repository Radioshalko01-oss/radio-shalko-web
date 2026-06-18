import type { Metadata } from "next";
import { CotizacionPage } from "@/components/pages/cotizacion-page";

export const metadata: Metadata = {
  title: "Cotización",
};

export default function Page() {
  return <CotizacionPage />;
}
