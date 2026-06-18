import { GarantiaPage } from "@/components/pages/garantia-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Garantía",
};

export default function GarantiaRoute() {
  return <GarantiaPage />;
}
