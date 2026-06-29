import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell,
  ChevronRight,
  Heart,
  Lock,
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
import {
  getCustomerNotificationSummary,
} from "@/lib/notifications/customer-notification-queries";
import { getQuoteItems } from "@/lib/quotes/actions";
import { signOut } from "@/lib/auth/actions";

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
  const accountType = account.isAdmin ? "Administrador" : "Usuario";

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-28 pt-28 md:px-8 md:pt-32">
      {/* Encabezado */}
      <header className="flex items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-foreground text-xl font-semibold text-background">
          {(account.email?.[0] ?? "U").toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-semibold capitalize tracking-tight md:text-3xl">
            {username}
          </h1>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>
      </header>

      {/* Sección 1 — Perfil */}
      <Section title="Perfil">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          <Cell label="Nombre" value={username} capitalize />
          <Cell label="Correo" value={email} />
          <Cell label="Tipo de cuenta" value={accountType} badge={account.isAdmin} />
        </div>
      </Section>

      {/* Sección 2 — Actividad */}
      <Section title="Actividad">
        <div className="grid gap-4 sm:grid-cols-2">
          {!account.isAdmin && (
            <ActivityCard
              href="/favoritos"
              icon={<Heart className="h-5 w-5" />}
              title="Favoritos"
              desc="Productos que has guardado."
            />
          )}
          <ActivityCard
            href="/carrito"
            icon={<ShoppingBag className="h-5 w-5" />}
            title={account.isAdmin ? "Carrito tienda" : "Mi carrito"}
            desc={
              account.isAdmin
                ? cartCount > 0
                  ? `${cartCount} producto${cartCount === 1 ? "" : "s"} en selección`
                  : "Prepara una selección para compartir con un cliente."
                : cartCount > 0
                  ? `${cartCount} producto${cartCount === 1 ? "" : "s"} esperando`
                  : "Productos que has agregado."
            }
          />
          <ActivityCard
            href="/cuenta/notificaciones"
            icon={<Bell className="h-5 w-5" />}
            title="Notificaciones"
            desc={
              notificationSummary && notificationSummary.unreadCount > 0
                ? `${notificationSummary.unreadCount} nueva${notificationSummary.unreadCount === 1 ? "" : "s"}`
                : account.isAdmin
                  ? "Actualizaciones de pedidos y carrito."
                  : "Actualizaciones de tus pedidos y carrito."
            }
            badge={
              notificationSummary?.unreadCount
                ? notificationSummary.unreadCount
                : undefined
            }
          />
          <ActivityCard
            href={account.isAdmin ? "/admin/pedidos" : "/cuenta/pedidos"}
            icon={<Package className="h-5 w-5" />}
            title={account.isAdmin ? "Pedidos de clientes" : "Pedidos"}
            desc={
              account.isAdmin
                ? "Gestiona solicitudes y pagos desde el panel."
                : orderSummary
                  ? customerOrdersCardDescription(orderSummary)
                  : "Historial y seguimiento"
            }
            badge={
              !account.isAdmin && orderSummary?.readyForPickupCount
                ? orderSummary.readyForPickupCount
                : !account.isAdmin && orderSummary?.paymentAvailableCount
                  ? orderSummary.paymentAvailableCount
                  : undefined
            }
          />
        </div>
      </Section>

      {/* Sección 3 — Seguridad */}
      <Section title="Seguridad" id="seguridad">
        <div className="rounded-2xl border border-border bg-card/60 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-3 text-sm">
              <Row label="Método de acceso" value="Google" />
              <Row
                label="Sesión"
                value={
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Activa
                  </span>
                }
              />
              <form action={signOut} className="pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-red-300 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </form>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl border border-border bg-background/60 p-4">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Tu acceso es exclusivamente con Google.{" "}
                <span className="font-medium text-foreground">
                  Radio Shalko nunca te pedirá una contraseña
                </span>{" "}
                ni la almacena.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Sección 4 — Administrador (solo admin, discreto) */}
      {account.isAdmin && (
        <Section title="Administrador">
          <Link
            href="/admin"
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card/60 p-5 transition-colors hover:border-foreground/20"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground/70">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Panel admin</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Centro operativo de pedidos y catálogo.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-10 scroll-mt-28 first:mt-8">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Cell({
  label,
  value,
  capitalize,
  badge,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
  badge?: boolean;
}) {
  return (
    <div className="bg-card/60 p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      {badge ? (
        <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground/80">
          <ShieldCheck className="h-3.5 w-3.5" />
          {value}
        </span>
      ) : (
        <p
          className={`mt-1 truncate text-sm font-medium text-foreground ${
            capitalize ? "capitalize" : ""
          }`}
        >
          {value}
        </p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function ActivityCard({
  href,
  icon,
  title,
  desc,
  soon,
  badge,
}: {
  href?: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  soon?: boolean;
  badge?: number;
}) {
  const inner = (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground/70">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {soon && (
            <span className="rounded-full border border-border bg-background px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
              Pronto
            </span>
          )}
          {!soon && badge != null && badge > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] font-semibold tabular-nums text-background">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{desc}</p>
      </div>
      {!soon && (
        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5" />
      )}
    </>
  );

  if (soon || !href) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/40 p-5 opacity-80">
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card/60 p-5 transition-colors hover:border-foreground/20"
    >
      {inner}
    </Link>
  );
}
