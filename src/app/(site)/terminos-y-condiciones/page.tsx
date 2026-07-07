import type { Metadata } from "next";
import { TerminosPage } from "@/components/pages/terminos-page";

export const metadata: Metadata = {
  title: "Términos y condiciones | Radio Shalko",
  description:
    "Términos informativos sobre el uso del sitio, solicitudes de compra y condiciones generales de Radio Shalko.",
  robots: { index: true, follow: true },
};

export default function TerminosRoute() {
  return <TerminosPage />;
}
