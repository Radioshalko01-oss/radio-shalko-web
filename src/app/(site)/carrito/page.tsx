import type { Metadata } from "next";
import { CotizacionPage } from "@/components/pages/cotizacion-page";
import { getCurrentAccount } from "@/lib/auth/account";

export const metadata: Metadata = {
  title: "Carrito",
};

export default async function Page() {
  const account = await getCurrentAccount();
  return <CotizacionPage isAdmin={account?.isAdmin ?? false} />;
}
