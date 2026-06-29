"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/notifications/notification-actions";
import { resolveNotificationHref } from "@/lib/notifications/resolve-notification-href";
import type { CustomerNotificationItem } from "@/lib/notifications/customer-notification-queries";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function CustomerNotificationsList({
  notifications,
  isAdmin = false,
}: {
  notifications: CustomerNotificationItem[];
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const markAll = () => {
    startTransition(async () => {
      await markAllNotificationsAsRead();
      router.refresh();
    });
  };

  const openNotification = (notification: CustomerNotificationItem) => {
    startTransition(async () => {
      if (!notification.readAt) {
        await markNotificationAsRead(notification.id);
      }
      router.refresh();
      const href = resolveNotificationHref(notification.href, isAdmin);
      if (href) router.push(href);
    });
  };

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 py-16 text-center">
        <Bell className="h-9 w-9 text-muted-foreground/40" />
        <div>
          <p className="text-sm font-medium text-foreground">No tienes notificaciones</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {isAdmin
              ? "Cuando haya novedades sobre pedidos o carrito, aparecerán aquí."
              : "Cuando haya novedades sobre tus pedidos o carrito, aparecerán aquí."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={markAll}
            disabled={isPending}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground/20 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Marcar todas como leídas
          </button>
        </div>
      )}

      <ul className="grid gap-2">
        {notifications.map((notification) => (
          <li key={notification.id}>
            <button
              type="button"
              onClick={() => openNotification(notification)}
              disabled={isPending}
              className="w-full rounded-2xl border border-border bg-card/60 p-4 text-left transition-colors hover:border-foreground/15 disabled:opacity-70"
            >
              <div className="flex items-start gap-3">
                {!notification.readAt && (
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-foreground"
                    aria-hidden
                  />
                )}
                <div className={notification.readAt ? "min-w-0 flex-1" : "min-w-0 flex-1 pl-0"}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p
                      className={
                        notification.readAt
                          ? "text-sm font-medium text-foreground/80"
                          : "text-sm font-medium text-foreground"
                      }
                    >
                      {notification.title}
                    </p>
                    <time
                      dateTime={notification.createdAt}
                      className="shrink-0 text-xs text-muted-foreground"
                    >
                      {formatDateTime(notification.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {notification.message}
                  </p>
                  {notification.href && (
                    <p className="mt-2 text-xs font-medium text-foreground/70">
                      Ver detalle →
                    </p>
                  )}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <p className="text-center text-xs text-muted-foreground">
        {isAdmin ? (
          <>
            También puedes gestionar pedidos en{" "}
            <Link href="/admin/pedidos" className="font-medium text-foreground underline-offset-2 hover:underline">
              Pedidos de clientes
            </Link>
            .
          </>
        ) : (
          <>
            También puedes revisar tus pedidos en{" "}
            <Link href="/cuenta/pedidos" className="font-medium text-foreground underline-offset-2 hover:underline">
              Mis pedidos
            </Link>
            .
          </>
        )}
      </p>
    </div>
  );
}
