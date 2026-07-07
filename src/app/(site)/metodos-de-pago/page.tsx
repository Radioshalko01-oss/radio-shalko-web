import type { Metadata } from "next";
import { MetodosDePagoPage } from "@/components/pages/metodos-de-pago-page";

export const metadata: Metadata = {
  title: "Métodos de pago",
  description:
    "Opciones de pago en Radio Shalko: tienda física, transferencia previa confirmación y link seguro cuando aplique.",
};

export default function MetodosDePagoRoute() {
  return <MetodosDePagoPage />;
}
