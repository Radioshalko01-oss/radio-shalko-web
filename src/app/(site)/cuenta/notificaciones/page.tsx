import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/auth/account";
import { listCustomerNotifications } from "@/lib/notifications/customer-notification-queries";
import { AccountPageShell } from "@/components/account/account-page-shell";
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

      <AccountPageShell>
        <CustomerNotificationsList notifications={notifications} isAdmin={account.isAdmin} />
      </AccountPageShell>
    </>
  );
}
