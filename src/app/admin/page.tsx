import Link from "next/link";
import { ArrowUpRight, ClipboardList, Eye, EyeOff, Package, Plus } from "lucide-react";
import { listAdminProducts } from "@/lib/admin/product-queries";
import { getAdminOrderNotificationSummary } from "@/lib/orders/notification-queries";
import { AdminButton } from "@/components/admin/admin-button";
import { PageHeader } from "@/components/ui/page-header";
import { adminShell } from "@/lib/design/admin-shell";
import { cn } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [products, orderSummary] = await Promise.all([
    listAdminProducts(),
    getAdminOrderNotificationSummary(),
  ]);
  const total = products.length;
  const published = products.filter((p) => p.isPublished).length;
  const hidden = total - published;

  const stats = [
    { label: "Productos", value: total, icon: Package, href: "/admin/productos" },
    {
      label: "Publicados",
      value: published,
      icon: Eye,
      href: "/admin/productos?estado=publicados",
    },
    {
      label: "Ocultos",
      value: hidden,
      icon: EyeOff,
      href: "/admin/productos?estado=ocultos",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        variant="admin"
        title="Dashboard"
        description="Resumen del catálogo de Radio Shalko."
        actions={
          <AdminButton asChild variant="primary">
            <Link href="/admin/productos/nuevo">
              <Plus className="h-4 w-4" />
              Nuevo producto
            </Link>
          </AdminButton>
        }
      />

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className={cn(adminShell.cardInteractive, "group p-5")}
            >
              <div className="flex items-center justify-between">
                <dt className={adminShell.statLabel}>{stat.label}</dt>
                <Icon className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-copper" />
              </div>
              <dd className={cn(adminShell.statValue, "mt-2")}>{stat.value}</dd>
            </Link>
          );
        })}
      </dl>

      <div className={cn(adminShell.cardSection, "mt-8")}>
        <h2 className={adminShell.sectionTitleSm}>Accesos rápidos</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <QuickLink href="/admin/productos" title="Gestionar productos" desc="Crear, editar, publicar e imágenes." />
          <QuickLink href="/admin/productos/nuevo" title="Crear producto" desc="Da de alta un nuevo artículo." />
          <QuickLink href="/admin/categorias" title="Categorías" desc="Organiza el catálogo." />
          <QuickLink href="/admin/marcas" title="Marcas" desc="Administra marcas oficiales." />
          <QuickLink
            href="/admin/pedidos"
            title="Pedidos"
            desc={
              orderSummary.pendingCount > 0
                ? `${orderSummary.pendingCount} solicitud${orderSummary.pendingCount === 1 ? "" : "es"} pendiente${orderSummary.pendingCount === 1 ? "" : "s"} de revisión.`
                : "Revisa solicitudes de compra recibidas."
            }
            icon={ClipboardList}
            highlight={orderSummary.pendingCount > 0}
          />
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  desc,
  icon: Icon,
  highlight,
}: {
  href: string;
  title: string;
  desc: string;
  icon?: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        adminShell.cardInteractive,
        "group flex items-start justify-between gap-3 p-4",
        highlight && "border-copper/20 bg-copper/[0.02]",
      )}
    >
      <div className="flex min-w-0 gap-3">
        {Icon && (
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-copper" />
        )}
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
    </Link>
  );
}
