"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteLogo } from "@/components/brand/site-logo";
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

/** Ocultos en nav (rutas intactas). */
const HIDDEN_NAV_HREFS = new Set([
  "/admin/clientes",
  "/admin/analiticas",
  "/admin/ajustes",
  "/carrito",
]);

function isNavVisible(item: Item) {
  if (item.soon) return false;
  if (HIDDEN_NAV_HREFS.has(item.href)) return false;
  return true;
}

function visibleGroups() {
  return GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(isNavVisible),
  })).filter((group) => group.items.length > 0);
}

const NAV_GROUPS = visibleGroups();

export function AdminSidebar({ pendingOrderCount = 0 }: { pendingOrderCount?: number }) {
  const pathname = usePathname();

  const isActive = (item: Item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <aside className={adminShell.sidebar}>
      <div className="border-b border-border/60 px-4 py-5 lg:px-5 lg:py-6">
        <Link href="/" className="flex min-w-0 items-center justify-center">
          <SiteLogo variant="horizontal" context="admin" size="sm" />
        </Link>
      </div>

      <nav
        className="flex-1 overflow-y-auto px-3 py-3 lg:space-y-9 lg:py-4"
        aria-label="Administración"
      >
        {NAV_GROUPS.map((group, i) => (
          <div
            key={group.title ?? `g-${i}`}
            className={cn("mb-4 last:mb-0 lg:mb-0", group.title && i > 0 && "lg:mt-2")}
          >
            {group.title && (
              <p
                className={cn(
                  "px-3 pb-2",
                  typography.eyebrow,
                  "hidden text-[10px] tracking-[0.16em] lg:block",
                  i === 1 && "lg:pt-5",
                )}
              >
                {group.title}
              </p>
            )}
            <div className="flex snap-x snap-mandatory gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:snap-none lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex shrink-0 snap-start items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors lg:shrink lg:snap-align-none lg:gap-2.5",
                      active
                        ? "bg-card font-medium text-foreground shadow-sm ring-1 ring-border/80"
                        : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-copper" : "text-muted-foreground/70",
                      )}
                    />
                    <span className="min-w-0 flex-1">{item.label}</span>
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
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border/60 p-3">
        <Link href="/" className={cn(adminShell.backLink, "w-full rounded-lg px-3 py-2 hover:bg-card/70")}>
          <ArrowLeft className="h-4 w-4" />
          Volver al sitio
        </Link>
      </div>
    </aside>
  );
}
