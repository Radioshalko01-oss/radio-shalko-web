import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth/account";
import { listCustomerNotifications } from "@/lib/notifications/customer-notification-queries";
import { CustomerNotificationsList } from "@/components/account/customer-notifications-list";
import { SitePageHero } from "@/components/site/site-page-hero";
import { finalizeBreadcrumbs, siteCrumbs } from "@/lib/site/breadcrumbs";

export const metadata: Metadata = {
  title: "Notificaciones | Radio Shalko",
  robots: { index: false, follow: false },
};

export default async function CuentaNotificacionesPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login?login=required&next=/cuenta/notificaciones");

  const notifications = await listCustomerNotifications();

  return (
    <>
      <SitePageHero
        breadcrumbs={finalizeBreadcrumbs([
          siteCrumbs.home,
          siteCrumbs.cuenta,
          siteCrumbs.notificaciones,
        ])}
        title="Notificaciones"
        description={
          account.isAdmin
            ? "Actualizaciones de pedidos y carrito."
            : "Actualizaciones de tus pedidos y carrito."
        }
      />

      <div className="mx-auto w-full max-w-3xl px-5 pb-28 md:px-8">
        <Link
          href="/cuenta"
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a mi cuenta
        </Link>

        <div className="mt-6">
          <CustomerNotificationsList notifications={notifications} isAdmin={account.isAdmin} />
        </div>
      </div>
    </>
  );
}
