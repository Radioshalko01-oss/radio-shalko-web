"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteLogo } from "@/components/brand/site-logo";
import {
  ArrowLeft,
  BarChart3,
  Boxes,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  ClipboardList,
  Store,
  Tags,
  Users,
} from "lucide-react";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  soon?: boolean;
  exact?: boolean;
};

type Group = {
  title: string | null;
  items: Item[];
};

const GROUPS: Group[] = [
  {
    title: null,
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/admin/productos", label: "Productos", icon: Package },
      { href: "/admin/categorias", label: "Categorías", icon: Tags },
      { href: "/admin/marcas", label: "Marcas", icon: FileText },
      { href: "/admin/inventario", label: "Inventario", icon: Boxes },
    ],
  },
  {
    title: "Ventas",
    items: [
      { href: "/carrito", label: "Carrito tienda", icon: Store },
      { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
      { href: "/admin/clientes", label: "Clientes", icon: Users, soon: true },
    ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/admin/analiticas", label: "Analíticas", icon: BarChart3, soon: true },
      { href: "/admin/ajustes", label: "Ajustes", icon: Settings, soon: true },
    ],
  },
];

export function AdminSidebar({ pendingOrderCount = 0 }: { pendingOrderCount?: number }) {
  const pathname = usePathname();

  const isActive = (item: Item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50/80">
      <div className="px-5 py-5">
        <Link href="/admin" className="flex min-w-0 items-center">
          <SiteLogo variant="horizontal" context="admin" size="sm" />
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4" aria-label="Administración">
        {GROUPS.map((group, i) => (
          <div key={group.title ?? `g-${i}`}>
            {group.title && (
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);

                if (item.soon) {
                  return (
                    <div
                      key={item.href}
                      className="flex cursor-default items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-400"
                      title="Disponible en una fase futura"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      <span className="rounded-full border border-zinc-200 bg-white px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-zinc-400">
                        Pronto
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-white font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200"
                        : "text-zinc-600 hover:bg-white hover:text-zinc-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="min-w-0 flex-1">{item.label}</span>
                    {item.href === "/admin/pedidos" && pendingOrderCount > 0 && (
                      <span
                        className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1.5 text-[10px] font-semibold tabular-nums text-white"
                        aria-label={`${pendingOrderCount} pendientes de revisión`}
                      >
                        {pendingOrderCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-zinc-200 p-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-white hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al sitio
        </Link>
      </div>
    </aside>
  );
}
