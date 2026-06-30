"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  Save,
  Search,
  SlidersHorizontal,
  SquarePen,
} from "lucide-react";
import { formatPrice } from "@/lib/catalog/format";
import type { CatalogBranch, CatalogBrand, CatalogCategoryTree } from "@/lib/catalog/types";
import type { InventoryItem, InventoryResult } from "@/lib/admin/inventory-queries";
import { LOW_STOCK_THRESHOLD } from "@/lib/admin/inventory-constants";
import { updateProductInventory } from "@/lib/admin/product-actions";
import { AdminButton } from "@/components/admin/admin-button";
import { AdminEmptyState, adminInputClass, adminSelectClass } from "@/components/admin/admin-patterns";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { adminShell } from "@/lib/design/admin-shell";
import { cn } from "@/lib/utils";

type Filters = {
  q: string;
  cat: string;
  sub: string;
  brand: string;
  estado: string;
  stock: string;
  branch: string;
  sort: string;
  per: string;
};

const selectCls = adminSelectClass();

type StockStatus = "out" | "low" | "ok";
function statusOf(total: number): StockStatus {
  if (total <= 0) return "out";
  if (total <= LOW_STOCK_THRESHOLD) return "low";
  return "ok";
}

function StockBadge({ total }: { total: number }) {
  const s = statusOf(total);
  if (s === "out") {
    return (
      <AdminStatusBadge tone="danger" dot>
        Sin stock
      </AdminStatusBadge>
    );
  }
  if (s === "low") {
    return (
      <AdminStatusBadge tone="pending" dot>
        Bajo stock
      </AdminStatusBadge>
    );
  }
  return (
    <AdminStatusBadge tone="active" dot>
      Disponible
    </AdminStatusBadge>
  );
}

export function InventoryManager({
  result,
  brands,
  categories,
  branches,
  filters,
}: {
  result: InventoryResult;
  brands: CatalogBrand[];
  categories: CatalogCategoryTree[];
  branches: CatalogBranch[];
  filters: Filters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const items = result.items;
  const idsSig = items.map((i) => i.id).join(",");

  const [q, setQ] = useState(filters.q);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const firstSearch = useRef(true);

  const buildUrl = (updates: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };
  const navigate = (updates: Record<string, string | undefined>, keepPage = false) => {
    router.replace(buildUrl(keepPage ? updates : { ...updates, page: undefined }));
  };

  useEffect(() => {
    if (firstSearch.current) {
      firstSearch.current = false;
      return;
    }
    const t = setTimeout(() => navigate({ q: q.trim() || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Datos refrescados → limpiar borradores.
  useEffect(() => {
    setDrafts({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsSig]);

  const flash = (msg: string) => {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess((s) => (s === msg ? null : s)), 3000);
  };

  const getVal = (p: InventoryItem, branchId: string) =>
    drafts[p.id]?.[branchId] ?? String(p.byBranch[branchId] ?? 0);

  const setVal = (productId: string, branchId: string, value: string) =>
    setDrafts((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] ?? {}), [branchId]: value },
    }));

  const liveTotal = (p: InventoryItem) =>
    branches.reduce((sum, b) => sum + Math.max(0, Math.round(Number(getVal(p, b.id)) || 0)), 0);

  const isDirty = (p: InventoryItem) =>
    branches.some(
      (b) => Math.max(0, Math.round(Number(getVal(p, b.id)) || 0)) !== (p.byBranch[b.id] ?? 0),
    );

  const save = (p: InventoryItem) => {
    setError(null);
    setSavingId(p.id);
    startTransition(async () => {
      const itemsToSave = branches.map((b) => ({
        branchId: b.id,
        quantity: Math.max(0, Math.round(Number(getVal(p, b.id)) || 0)),
      }));
      const res = await updateProductInventory(p.id, itemsToSave);
      setSavingId(null);
      if (!res.ok) return setError(res.error);
      flash(`Stock de "${p.name}" actualizado.`);
      router.refresh();
    });
  };

  const activeCategory = categories.find((c) => c.id === filters.cat);
  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage));
  const hasFilters =
    Boolean(
      filters.q || filters.cat || filters.sub || filters.brand || filters.estado || filters.stock || filters.branch,
    ) || filters.sort !== "name";

  const sortOptions = [
    { value: "name", label: "Nombre" },
    { value: "total", label: "Stock total" },
    ...branches.map((b) => ({ value: `b_${b.id}`, label: `Stock ${b.displayName || b.name}` })),
    { value: "price", label: "Precio" },
    { value: "recent", label: "Más recientes" },
  ];

  return (
    <div>
      {error && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <Check className="h-4 w-4" />
          {success}
        </p>
      )}

      {/* Toolbar */}
      <div className={adminShell.cardToolbar}>
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, SKU o marca…"
            className={cn(adminInputClass(), "pl-9")}
          />
        </div>

        <div className={cn("mt-3 flex flex-wrap items-center gap-2 border-t pt-3", adminShell.dividerSoft)}>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
          </span>

          <select
            value={filters.cat}
            onChange={(e) => navigate({ cat: e.target.value || undefined, sub: undefined })}
            className={selectCls}
          >
            <option value="">Categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={filters.sub}
            onChange={(e) => navigate({ sub: e.target.value || undefined })}
            disabled={!activeCategory}
            className={`${selectCls} disabled:opacity-50`}
          >
            <option value="">Subcategoría</option>
            {activeCategory?.subcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={filters.brand}
            onChange={(e) => navigate({ brand: e.target.value || undefined })}
            className={selectCls}
          >
            <option value="">Marca</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={filters.estado}
            onChange={(e) => navigate({ estado: e.target.value || undefined })}
            className={selectCls}
          >
            <option value="">Estado</option>
            <option value="publicados">Publicados</option>
            <option value="ocultos">Ocultos</option>
          </select>

          <select
            value={filters.stock}
            onChange={(e) => navigate({ stock: e.target.value || undefined })}
            className={selectCls}
          >
            <option value="">Stock</option>
            <option value="con">Con stock</option>
            <option value="bajo">Bajo stock</option>
            <option value="sin">Sin stock</option>
          </select>

          <select
            value={filters.branch}
            onChange={(e) => navigate({ branch: e.target.value || undefined })}
            className={selectCls}
            title="Acota el filtro de stock a una sucursal"
          >
            <option value="">Sucursal (todas)</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.displayName || b.name}
              </option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-2">
            <select
              value={filters.sort}
              onChange={(e) => navigate({ sort: e.target.value === "name" ? undefined : e.target.value })}
              className={selectCls}
            >
              {sortOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {hasFilters && (
              <button
                onClick={() => router.replace(pathname)}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className={cn(adminShell.tableShell, "mt-4")}>
        {items.length === 0 ? (
          <AdminEmptyState
            icon={<Package className="h-8 w-8 text-muted-foreground/40" />}
            title="Sin productos"
            description="Ajusta los filtros para ver inventario."
          />
        ) : (
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className={cn("border-b bg-muted/30", adminShell.dividerSoft)}>
                <th className={adminShell.tableHeadCell}>Imagen</th>
                <th className={adminShell.tableHeadCell}>Producto</th>
                <th className={adminShell.tableHeadCell}>SKU</th>
                <th className={adminShell.tableHeadCell}>Marca</th>
                <th className={adminShell.tableHeadCell}>Categoría</th>
                {branches.map((b) => (
                  <th key={b.id} className={cn(adminShell.tableHeadCell, "text-center")}>
                    {b.displayName || b.name}
                  </th>
                ))}
                <th className={cn(adminShell.tableHeadCell, "text-center")}>Total</th>
                <th className={adminShell.tableHeadCell}>Estado</th>
                <th className={cn(adminShell.tableHeadCell, "text-right")}>Guardar</th>
              </tr>
            </thead>
            <tbody>
                {items.map((p) => {
                  const total = liveTotal(p);
                  const dirty = isDirty(p);
                  const rowSaving = savingId === p.id && pending;
                  return (
                    <tr key={p.id} className={adminShell.tableRow}>
                      <td className={cn(adminShell.tableCell, "px-2")}>
                        <div className="h-10 w-10 overflow-hidden rounded-lg border border-border bg-muted/40">
                          {p.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                          )}
                        </div>
                      </td>
                      <td className={cn(adminShell.tableCell, "max-w-xs")}>
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{formatPrice(p.price)}</p>
                      </td>
                      <td className={cn(adminShell.tableCell, "text-muted-foreground")}>{p.sku ?? "—"}</td>
                      <td className={adminShell.tableCell}>{p.brandName ?? "—"}</td>
                      <td className={adminShell.tableCell}>
                        {p.categoryName ?? "—"}
                        {p.subcategoryName && (
                          <span className="text-muted-foreground"> / {p.subcategoryName}</span>
                        )}
                      </td>
                      {branches.map((b) => {
                        const val = getVal(p, b.id);
                        const num = Math.max(0, Math.round(Number(val) || 0));
                        const tone =
                          num <= 0
                            ? "border-red-200/80 text-red-700 focus:border-red-300 focus:ring-red-100"
                            : num <= LOW_STOCK_THRESHOLD
                              ? "border-amber-200/80 text-amber-800 focus:border-amber-300 focus:ring-amber-100"
                              : "border-border text-foreground focus:border-copper/40 focus:ring-copper/10";
                        return (
                          <td key={b.id} className={cn(adminShell.tableCell, "text-center")}>
                            <input
                              type="number"
                              min={0}
                              value={val}
                              onChange={(e) => setVal(p.id, b.id, e.target.value)}
                              className={cn(
                                "h-9 w-16 rounded-lg border bg-card text-center text-sm focus:outline-none focus:ring-2",
                                tone,
                              )}
                            />
                          </td>
                        );
                      })}
                      <td className={cn(adminShell.tableCell, "text-center font-semibold tabular-nums")}>
                        {total}
                      </td>
                      <td className={adminShell.tableCell}>
                        <StockBadge total={total} />
                      </td>
                      <td className={adminShell.tableCell}>
                        <div className="flex items-center justify-end gap-1">
                          <AdminButton
                            type="button"
                            size="sm"
                            onClick={() => save(p)}
                            disabled={!dirty || pending}
                            title={dirty ? "Guardar stock" : "Sin cambios"}
                          >
                            {rowSaving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                            Guardar
                          </AdminButton>
                          <Link
                            href={`/admin/productos/${p.id}/editar`}
                            title="Editar producto"
                            className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                          >
                            <SquarePen className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        )}

        {items.length > 0 && (
          <div className={cn("flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row", adminShell.dividerSoft)}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Por página</span>
              <select
                value={filters.per}
                onChange={(e) => navigate({ per: e.target.value === "25" ? undefined : e.target.value })}
                className={cn(adminShell.select, "h-8 px-2 text-xs")}
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="ml-1">
                {result.total === 0
                  ? "0"
                  : `${(result.page - 1) * result.perPage + 1}–${Math.min(result.page * result.perPage, result.total)}`}{" "}
                de {result.total}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate({ page: result.page > 2 ? String(result.page - 1) : undefined }, true)}
                disabled={result.page <= 1}
                className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/40 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-xs text-muted-foreground">
                {result.page} / {totalPages}
              </span>
              <button
                onClick={() => navigate({ page: String(result.page + 1) }, true)}
                disabled={result.page >= totalPages}
                className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/40 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        El umbral de bajo stock es {LOW_STOCK_THRESHOLD}. El stock editado se aplica por sucursal y se
        refleja en el catálogo público según el estado de publicación del producto.
      </p>
    </div>
  );
}
