import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminPendingOrdersAlert } from "@/components/admin/admin-pending-orders-alert";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminOrderNotificationSummary } from "@/lib/orders/notification-queries";
import { adminShell } from "@/lib/design/admin-shell";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Administración",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  const orderSummary = await getAdminOrderNotificationSummary();

  return (
    <div className={cn("flex min-h-screen flex-col lg:flex-row", adminShell.layoutBg)}>
      <AdminSidebar pendingOrderCount={orderSummary.pendingCount} />
      <div className={cn(adminShell.main, adminShell.mainPadding)}>
        <AdminPendingOrdersAlert summary={orderSummary} />
        {children}
      </div>
    </div>
  );
}
