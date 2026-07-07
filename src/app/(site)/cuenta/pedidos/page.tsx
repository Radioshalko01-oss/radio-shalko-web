import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth/account";
import { listCustomerOrders } from "@/lib/orders/customer-queries";
import { AccountPageShell } from "@/components/account/account-page-shell";
import { CustomerOrdersList } from "@/components/account/customer-orders-list";
import { SitePageHero } from "@/components/site/site-page-hero";
import { finalizeBreadcrumbs, siteCrumbs } from "@/lib/site/breadcrumbs";

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
    <>
      <SitePageHero
        breadcrumbs={finalizeBreadcrumbs([
          siteCrumbs.home,
          siteCrumbs.cuenta,
          siteCrumbs.pedidos,
        ])}
        title="Mis pedidos"
        description="Consulta el estado de tus solicitudes de compra y recolección en tienda."
      />

      <AccountPageShell backLabel="Mi cuenta">
        <CustomerOrdersList orders={orders} />
      </AccountPageShell>
    </>
  );
}
