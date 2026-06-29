import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth/account";
import { getCustomerOrder } from "@/lib/orders/customer-queries";
import { CustomerOrderDetailView } from "@/components/account/customer-order-detail-view";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ paid?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const order = await getCustomerOrder(id);
  return {
    title: order ? `Pedido ${order.orderNumber} | Radio Shalko` : "Pedido | Radio Shalko",
    robots: { index: false, follow: false },
  };
}

export default async function CuentaPedidoDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { paid } = await searchParams;

  const account = await getCurrentAccount();
  if (!account) {
    redirect(`/login?login=required&next=/cuenta/pedidos/${id}`);
  }
  if (account.isAdmin) redirect(`/admin/pedidos/${id}`);

  const order = await getCustomerOrder(id);
  if (!order) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-28 pt-28 md:px-8 md:pt-32">
      <CustomerOrderDetailView order={order} paidQuery={paid} />
    </div>
  );
}
