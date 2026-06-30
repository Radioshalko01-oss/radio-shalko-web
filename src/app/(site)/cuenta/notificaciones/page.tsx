import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth/account";
import { listCustomerNotifications } from "@/lib/notifications/customer-notification-queries";
import { CustomerNotificationsList } from "@/components/account/customer-notifications-list";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Notificaciones | Radio Shalko",
  robots: { index: false, follow: false },
};

export default async function CuentaNotificacionesPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login?login=required&next=/cuenta/notificaciones");

  const notifications = await listCustomerNotifications();

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-28 pt-28 md:px-8 md:pt-32">
      <PageHeader
        variant="account"
        backLink={{ href: "/cuenta", label: "Volver a mi cuenta", icon: "arrow" }}
        title="Notificaciones"
        description={
          account.isAdmin
            ? "Actualizaciones de pedidos y carrito."
            : "Actualizaciones de tus pedidos y carrito."
        }
      />

      <div className="mt-6">
        <CustomerNotificationsList notifications={notifications} isAdmin={account.isAdmin} />
      </div>
    </div>
  );
}
