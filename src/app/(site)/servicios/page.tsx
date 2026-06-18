import { ServiciosPage } from "@/components/pages/servicios-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Servicios",
};

export default function ServiciosRoute() {
  return <ServiciosPage />;
}
