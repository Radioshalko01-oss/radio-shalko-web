import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCurrentAccount } from "@/lib/auth/account";
import { listCustomerOrders } from "@/lib/orders/customer-queries";
import { CustomerOrdersList } from "@/components/account/customer-orders-list";

export const metadata: Metadata = {
  title: "Mis pedidos | Radio Shalko",
  robots: { index: false, follow: false },
};

export default async function CuentaPedidosPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login?login=required&next=/cuenta/pedidos");
  if (account.isAdmin) redirect("/admin/pedidos");

  const orders = await listCustomerOrders();

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-28 pt-28 md:px-8 md:pt-32">
      <Link
        href="/cuenta"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Mi cuenta
      </Link>

      <header className="mt-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Mis pedidos
        </h1>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Consulta el estado de tus solicitudes de compra y recolección en tienda.
        </p>
      </header>

      <div className="mt-8">
        <CustomerOrdersList orders={orders} />
      </div>
    </div>
  );
}
