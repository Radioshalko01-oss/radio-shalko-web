import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth/account";
import { listCustomerOrders } from "@/lib/orders/customer-queries";
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

      <div className="mx-auto w-full max-w-3xl px-5 pb-28 md:px-8">
        <Link
          href="/cuenta"
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Mi cuenta
        </Link>

        <div className="mt-6">
          <CustomerOrdersList orders={orders} />
        </div>
      </div>
    </>
  );
}
