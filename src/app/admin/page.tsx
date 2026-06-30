import Link from "next/link";
import { ArrowUpRight, ClipboardList, Eye, EyeOff, Package, Plus } from "lucide-react";
import { listAdminProducts } from "@/lib/admin/product-queries";
import { getAdminOrderNotificationSummary } from "@/lib/orders/notification-queries";
import { PageHeader } from "@/components/ui/page-header";
import { radius } from "@/lib/design/tokens";

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
          <Link
            href="/admin/productos/nuevo"
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 ${radius.buttonAdmin} bg-zinc-900 px-3.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800`}
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Link>
        }
      />

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300"
            >
              <div className="flex items-center justify-between">
                <dt className="text-sm text-zinc-500">{stat.label}</dt>
                <Icon className="h-4 w-4 text-zinc-300 transition-colors group-hover:text-zinc-500" />
              </div>
              <dd className="mt-2 text-2xl font-semibold text-zinc-900">
                {stat.value}
              </dd>
            </Link>
          );
        })}
      </dl>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-900">Accesos rápidos</h2>
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
}: {
  href: string;
  title: string;
  desc: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start justify-between gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50/60"
    >
      <div className="flex min-w-0 gap-3">
        {Icon && (
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500" />
        )}
        <div>
          <p className="text-sm font-medium text-zinc-900">{title}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-600" />
    </Link>
  );
}
