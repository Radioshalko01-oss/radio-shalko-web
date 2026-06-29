import { notFound } from "next/navigation";
import { getAdminOrder } from "@/lib/orders/admin-queries";
import { OrderDetailView } from "@/components/admin/order-detail-view";

type Params = Promise<{ id: string }>;

export default async function AdminPedidoDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const order = await getAdminOrder(id);

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <OrderDetailView order={order} />
    </div>
  );
}
