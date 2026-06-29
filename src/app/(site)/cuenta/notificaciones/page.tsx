import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentAccount } from "@/lib/auth/account";
import { listCustomerNotifications } from "@/lib/notifications/customer-notification-queries";
import { CustomerNotificationsList } from "@/components/account/customer-notifications-list";

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
      <Link
        href="/cuenta"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mi cuenta
      </Link>

      <header className="mt-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Notificaciones
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {account.isAdmin
            ? "Actualizaciones de pedidos y carrito."
            : "Actualizaciones de tus pedidos y carrito."}
        </p>
      </header>

      <div className="mt-6">
        <CustomerNotificationsList notifications={notifications} isAdmin={account.isAdmin} />
      </div>
    </div>
  );
}
