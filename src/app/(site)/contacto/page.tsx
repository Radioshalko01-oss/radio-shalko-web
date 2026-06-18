import { ContactoPage } from "@/components/pages/contacto-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto",
};

export default function ContactoRoute() {
  return <ContactoPage />;
}
