import type { Metadata } from "next";
import { MetodosDePagoPage } from "@/components/pages/metodos-de-pago-page";

export const metadata: Metadata = {
  title: "Métodos de pago",
  description:
    "Opciones de pago en Radio Shalko: transferencia bancaria y pago presencial en tiendas Chalco y Amecameca.",
};

export default function MetodosDePagoRoute() {
  return <MetodosDePagoPage />;
}
