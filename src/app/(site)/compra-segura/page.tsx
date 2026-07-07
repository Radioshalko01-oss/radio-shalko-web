import type { Metadata } from "next";
import { CompraSeguraPage } from "@/components/pages/compra-segura-page";

export const metadata: Metadata = {
  title: "Compra segura | Radio Shalko",
  description:
    "Conoce cómo Radio Shalko protege tu compra: tienda física, canales oficiales y confirmación antes del pago.",
};

export default function CompraSeguraRoute() {
  return <CompraSeguraPage />;
}
