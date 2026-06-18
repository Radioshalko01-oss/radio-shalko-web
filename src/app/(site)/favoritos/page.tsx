import { FavoritosPage } from "@/components/pages/favoritos-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favoritos",
};

export default function FavoritosRoute() {
  return <FavoritosPage />;
}
