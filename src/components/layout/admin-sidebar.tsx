"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteLogo } from "@/components/brand/site-logo";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { adminShell } from "@/lib/design/admin-shell";
import { typography } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";
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

const FLAT_ITEMS = GROUPS.flatMap((group) => group.items);

function NavItem({
  item,
  active,
  pendingOrderCount,
  compact = false,
}: {
  item: Item;
  active: boolean;
  pendingOrderCount: number;
  compact?: boolean;
}) {
  const Icon = item.icon;

  if (item.soon) {
    return (
      <div
        className={cn(
          "flex shrink-0 cursor-default items-center justify-between rounded-lg text-muted-foreground/70",
          compact ? "gap-2 px-2.5 py-2 text-xs" : "px-3 py-2 text-sm",
        )}
        title="Disponible en una fase futura"
      >
        <span className="flex items-center gap-2">
          <Icon className={cn("shrink-0 opacity-60", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
          <span className="whitespace-nowrap">{item.label}</span>
        </span>
        <AdminStatusBadge tone="soon">Pronto</AdminStatusBadge>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex shrink-0 items-center rounded-lg transition-colors",
        compact ? "gap-1.5 px-2.5 py-2 text-xs" : "gap-2.5 px-3 py-2 text-sm",
        active
          ? "bg-card font-medium text-foreground shadow-sm ring-1 ring-border/80"
          : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "shrink-0",
          compact ? "h-3.5 w-3.5" : "h-4 w-4",
          active ? "text-copper" : "text-muted-foreground/70",
        )}
      />
      <span className="whitespace-nowrap">{item.label}</span>
      {item.href === "/admin/pedidos" && pendingOrderCount > 0 && (
        <span
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-copper px-1.5 text-[10px] font-semibold tabular-nums text-copper-foreground"
          aria-label={`${pendingOrderCount} pendientes de revisión`}
        >
          {pendingOrderCount}
        </span>
      )}
    </Link>
  );
}

export function AdminSidebar({ pendingOrderCount = 0 }: { pendingOrderCount?: number }) {
  const pathname = usePathname();

  const isActive = (item: Item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <aside className={adminShell.sidebar}>
      <div className="border-b border-border/60 px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin" className="flex min-w-0 shrink items-center">
            <SiteLogo variant="horizontal" context="admin" size="sm" />
          </Link>
          <Link
            href="/"
            className={cn(
              adminShell.backLink,
              "inline-flex shrink-0 items-center gap-1 rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs hover:bg-card/70",
            )}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Sitio
          </Link>
        </div>
      </div>

      <div className="hidden border-b border-border/60 px-5 py-6 lg:block">
        <Link href="/" className="flex min-w-0 items-center justify-center">
          <SiteLogo variant="horizontal" context="admin" size="sm" />
        </Link>
      </div>

      <nav
        className="border-b border-border/60 px-3 py-2 lg:flex-1 lg:overflow-y-auto lg:border-b-0 lg:px-3 lg:py-4"
        aria-label="Administración"
      >
        <div className="flex snap-x snap-mandatory gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
          {FLAT_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={isActive(item)}
              pendingOrderCount={pendingOrderCount}
              compact
            />
          ))}
        </div>

        <div className="hidden lg:block lg:space-y-9">
          {GROUPS.map((group, i) => (
            <div key={group.title ?? `g-${i}`} className={cn(group.title && i > 0 && "mt-2")}>
              {group.title && (
                <p
                  className={cn(
                    "px-3 pb-2",
                    typography.eyebrow,
                    "text-[10px] tracking-[0.16em]",
                    i === 1 && "pt-5",
                  )}
                >
                  {group.title}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                    active={isActive(item)}
                    pendingOrderCount={pendingOrderCount}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="hidden border-t border-border/60 p-3 lg:block">
        <Link href="/" className={cn(adminShell.backLink, "w-full rounded-lg px-3 py-2 hover:bg-card/70")}>
          <ArrowLeft className="h-4 w-4" />
          Volver al sitio
        </Link>
      </div>
    </aside>
  );
}
