import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth/account";
import { getCustomerOrder } from "@/lib/orders/customer-queries";
import { CustomerOrderDetailView } from "@/components/account/customer-order-detail-view";
import { SitePageHero } from "@/components/site/site-page-hero";
import { finalizeBreadcrumbs, siteCrumbs } from "@/lib/site/breadcrumbs";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const order = await getCustomerOrder(id);
  return {
    title: order ? `Pedido ${order.orderNumber} | Radio Shalko` : "Pedido | Radio Shalko",
    robots: { index: false, follow: false },
  };
}

type SearchParams = Promise<{ created?: string }>;

export default async function CuentaPedidoDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { created } = await searchParams;

  const account = await getCurrentAccount();
  if (!account) {
    redirect(`/login?login=required&next=/cuenta/pedidos/${id}`);
  }
  if (account.isAdmin) redirect(`/admin/pedidos/${id}`);

  const order = await getCustomerOrder(id);
  if (!order) notFound();

  return (
    <>
      <SitePageHero
        breadcrumbs={finalizeBreadcrumbs([
          siteCrumbs.home,
          siteCrumbs.cuenta,
          siteCrumbs.pedidos,
          { label: order.orderNumber },
        ])}
        title={order.orderNumber}
        description="Detalle y seguimiento de tu solicitud de compra."
      />

      <div className="mx-auto w-full max-w-3xl px-5 pb-28 md:px-8">
        <CustomerOrderDetailView order={order} createdQuery={created} />
      </div>
    </>
  );
}
