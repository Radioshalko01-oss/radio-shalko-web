import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminPendingOrdersAlert } from "@/components/admin/admin-pending-orders-alert";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminOrderNotificationSummary } from "@/lib/orders/notification-queries";

export const metadata: Metadata = {
  title: "Administración",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Defensa en profundidad: no confiar solo en el middleware.
  // Protege todas las rutas bajo /admin (actuales y futuras, incl. CRUD productos).
  await requireAdmin();

  const orderSummary = await getAdminOrderNotificationSummary();

  return (
    <div className="flex min-h-screen bg-white">
      <AdminSidebar pendingOrderCount={orderSummary.pendingCount} />
      <div className="flex-1 p-8">
        <AdminPendingOrdersAlert summary={orderSummary} />
        {children}
      </div>
    </div>
  );
}
