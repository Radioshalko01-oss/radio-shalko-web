import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth/account";
import { listCustomerOrders } from "@/lib/orders/customer-queries";
import { CustomerOrdersList } from "@/components/account/customer-orders-list";
import { PageHeader } from "@/components/ui/page-header";

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
      <PageHeader
        variant="account"
        backLink={{ href: "/cuenta", label: "Mi cuenta" }}
        title="Mis pedidos"
        description="Consulta el estado de tus solicitudes de compra y recolección en tienda."
      />

      <div className="mt-8">
        <CustomerOrdersList orders={orders} />
      </div>
    </div>
  );
}
