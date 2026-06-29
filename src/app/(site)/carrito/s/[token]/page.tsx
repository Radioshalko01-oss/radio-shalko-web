import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SharedCartPage } from "@/components/pages/shared-cart-page";
import { getSharedCartByToken } from "@/lib/shared-cart/queries";

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const cart = await getSharedCartByToken(token);
  return {
    title: cart ? "Carrito compartido" : "Carrito no encontrado",
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: PageProps) {
  const { token } = await params;
  const cart = await getSharedCartByToken(token);

  if (!cart) {
    notFound();
  }

  return <SharedCartPage cart={cart} />;
}
