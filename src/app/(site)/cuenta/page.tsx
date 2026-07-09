import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell,
  ChevronRight,
  Heart,
  LogOut,
  Package,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { getCurrentAccount } from "@/lib/auth/account";
import {
  customerOrdersCardDescription,
  getCustomerOrderSummary,
} from "@/lib/orders/customer-queries";
import { getCustomerNotificationSummary } from "@/lib/notifications/customer-notification-queries";
import { getQuoteItems } from "@/lib/quotes/actions";
import { signOut } from "@/lib/auth/actions";
import { SitePageHero } from "@/components/site/site-page-hero";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mi cuenta | Radio Shalko",
  robots: { index: false, follow: false },
};

export default async function CuentaPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login?login=required");

  const [orderSummary, notificationSummary, quoteItems] = await Promise.all([
    getCustomerOrderSummary(),
    getCustomerNotificationSummary(),
    getQuoteItems(),
  ]);

  const cartCount = quoteItems.reduce((sum, item) => sum + item.quantity, 0);

  const email = account.email ?? "Tu cuenta";
  const username = account.email?.split("@")[0] ?? "Mi cuenta";
  const accountType = account.isAdmin ? "Administrador" : "Cliente";
  const initial = (account.email?.[0] ?? "U").toUpperCase();

  const menuItems: MenuItem[] = [
    ...(!account.isAdmin
      ? [
          {
            href: "/favoritos",
            icon: <Heart className="h-4 w-4" />,
            label: "Favoritos",
            hint: "Productos guardados",
          },
        ]
      : []),
    {
      href: "/carrito",
      icon: <ShoppingBag className="h-4 w-4" />,
      label: account.isAdmin ? "Carrito tienda" : "Mi carrito",
      hint:
        cartCount > 0
          ? `${cartCount} producto${cartCount === 1 ? "" : "s"}`
          : account.isAdmin
            ? "Selección para clientes"
            : "Vacío",
      badge: cartCount > 0 ? cartCount : undefined,
    },
    {
      href: "/cuenta/notificaciones",
      icon: <Bell className="h-4 w-4" />,
      label: "Notificaciones",
      hint:
        notificationSummary && notificationSummary.unreadCount > 0
          ? `${notificationSummary.unreadCount} sin leer`
          : "Pedidos y carrito",
      badge: notificationSummary?.unreadCount || undefined,
    },
    {
      href: account.isAdmin ? "/admin/pedidos" : "/cuenta/pedidos",
      icon: <Package className="h-4 w-4" />,
      label: account.isAdmin ? "Pedidos de clientes" : "Mis pedidos",
      hint: account.isAdmin
        ? "Panel de solicitudes"
        : orderSummary
          ? customerOrdersCardDescription(orderSummary)
          : "Historial de compras",
      badge:
        !account.isAdmin && orderSummary?.readyForPickupCount
          ? orderSummary.readyForPickupCount
          : !account.isAdmin && orderSummary?.paymentAvailableCount
            ? orderSummary.paymentAvailableCount
            : undefined,
    },
    ...(account.isAdmin
      ? [
          {
            href: "/admin",
            icon: <ShieldCheck className="h-4 w-4" />,
            label: "Panel admin",
            hint: "Catálogo y operaciones",
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-[calc(100dvh-4.5rem)] flex-col">
      <SitePageHero
        variant="compact"
        align="center"
        showBreadcrumbs={false}
        title="Mi cuenta"
        description="Tu perfil, pedidos y preferencias en un solo lugar."
      />

      <div className="flex flex-1 flex-col items-center justify-start px-5 pb-28 pt-8 md:px-8 md:pt-10">
        <div className="w-full max-w-3xl space-y-5 md:space-y-6">
          {/* Tarjeta de perfil — una sola fuente de verdad */}
          <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-4 p-5 md:gap-5 md:p-6">
              <span
                className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-foreground font-display text-lg font-semibold text-background md:h-16 md:w-16 md:text-xl"
                aria-hidden
              >
                {initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg font-medium capitalize tracking-tight text-foreground md:text-xl">
                  {username}
                </p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{email}</p>
              </div>
              <span className="hidden shrink-0 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground/70 sm:inline-flex">
                {accountType}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border/70 bg-muted/20 px-5 py-3 md:px-6">
              <p className="text-xs text-muted-foreground">
                Acceso con Google ·{" "}
                <span className="font-medium text-emerald-600">Sesión activa</span>
              </p>
              <form action={signOut}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-red-600"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Salir
                </button>
              </form>
            </div>
          </article>

          {/* Menú de accesos */}
          <nav
            aria-label="Accesos de cuenta"
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            <ul>
              {menuItems.map((item, index) => (
                <li key={item.href}>
                  <MenuRow item={item} isLast={index === menuItems.length - 1} />
                </li>
              ))}
            </ul>
          </nav>

          <p className="px-1 text-center text-xs leading-relaxed text-muted-foreground">
            Radio Shalko nunca te pedirá una contraseña. Tu acceso es exclusivamente con Google.
          </p>
        </div>
      </div>
    </div>
  );
}

type MenuItem = {
  href: string;
  icon: ReactNode;
  label: string;
  hint: string;
  badge?: number;
};

function MenuRow({ item, isLast }: { item: MenuItem; isLast: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/35 md:px-6 md:py-[1.125rem]",
        !isLast && "border-b border-border/70",
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted/70 text-foreground/65">
        {item.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{item.label}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.hint}</p>
      </div>
      {item.badge != null && item.badge > 0 ? (
        <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] font-semibold tabular-nums text-background">
          {item.badge}
        </span>
      ) : null}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
    </Link>
  );
}
