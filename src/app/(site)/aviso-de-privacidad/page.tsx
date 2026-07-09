import type { Metadata } from "next";
import { PrivacidadPage } from "@/components/pages/privacidad-page";

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description:
    "Aviso informativo sobre el tratamiento de datos personales en Radio Shalko: finalidades, derechos y contacto.",
  robots: { index: true, follow: true },
};

export default function PrivacidadRoute() {
  return <PrivacidadPage />;
}
