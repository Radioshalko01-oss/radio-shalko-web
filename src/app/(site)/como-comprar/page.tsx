import type { Metadata } from "next";
import { ComoComprarPage } from "@/components/pages/como-comprar-page";

export const metadata: Metadata = {
  title: "Cómo comprar | Radio Shalko",
  description:
    "Guía paso a paso para comprar en Radio Shalko: catálogo, solicitud, confirmación y pago con atención personalizada.",
};

export default function ComoComprarRoute() {
  return <ComoComprarPage />;
}
