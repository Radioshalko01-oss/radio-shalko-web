"use client";

import { Fragment, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  SquarePen,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { formatPrice } from "@/lib/catalog/format";
import type { CatalogBranch, CatalogBrand, CatalogCategoryTree, CatalogProduct } from "@/lib/catalog/types";
import type { AdminProductListResult, AdminProductSort } from "@/lib/admin/product-queries";
import {
  bulkDeleteProducts,
  bulkSetBrand,
  bulkSetCategory,
  bulkSetPublished,
  quickUpdateProduct,
  setProductPublished,
  updateProductInventory,
} from "@/lib/admin/product-actions";

type Filters = {
  q: string;
  cat: string;
  sub: string;
  brand: string;
  estado: string;
  inv: string;
  sort: AdminProductSort;
  per: string;
};

const SORT_OPTIONS: { value: AdminProductSort; label: string }[] = [
  { value: "name_asc", label: "Nombre A–Z" },
  { value: "name_desc", label: "Nombre Z–A" },
  { value: "price_asc", label: "Precio ↑" },
  { value: "price_desc", label: "Precio ↓" },
  { value: "stock_asc", label: "Stock ↑" },
  { value: "stock_desc", label: "Stock ↓" },
  { value: "recent", label: "Más recientes" },
];

const selectCls =
  "h-9 rounded-lg border border-zinc-200 bg-white px-2.5 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100";

function stockOf(p: CatalogProduct): number {
  return p.inventory.reduce((s, i) => s + i.quantity, 0);
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-zinc-900/40 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="mt-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ProductsManager({
  result,
  brands,
  categories,
  branches,
  filters,
}: {
  result: AdminProductListResult;
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
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [quickId, setQuickId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "brand" | "category" | "delete">(null);

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

  // Búsqueda con debounce → URL.
  useEffect(() => {
    if (firstSearch.current) {
      firstSearch.current = false;
      return;
    }
    const t = setTimeout(() => navigate({ q: q.trim() || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Reiniciar selección/quick edit cuando cambia el conjunto visible.
  useEffect(() => {
    setSelected(new Set());
    setQuickId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsSig]);

  const flash = (msg: string) => {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess((s) => (s === msg ? null : s)), 3000);
  };

  const activeCategory = categories.find((c) => c.id === filters.cat);

  const allChecked = items.length > 0 && items.every((p) => selected.has(p.id));
  const someChecked = items.some((p) => selected.has(p.id));
  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(items.map((p) => p.id)));
  };
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedIds = useMemo(() => [...selected], [selected]);

  const togglePublish = (p: CatalogProduct) => {
    setError(null);
    startTransition(async () => {
      const res = await setProductPublished(p.id, !p.isPublished);
      if (!res.ok) return setError(res.error);
      flash(p.isPublished ? "Producto oculto." : "Producto publicado.");
      router.refresh();
    });
  };

  const runBulk = (fn: () => Promise<{ ok: boolean; error?: string; data?: { count: number } }>, label: string) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? "Ocurrió un error.");
      flash(`${res.data?.count ?? selectedIds.length} producto(s) ${label}.`);
      setSelected(new Set());
      setModal(null);
      router.refresh();
    });
  };

  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage));

  const hasFilters =
    Boolean(filters.q || filters.cat || filters.sub || filters.brand || filters.estado || filters.inv) ||
    filters.sort !== "name_asc";

  return (
    <div className="pb-24">
      {/* Feedback */}
      {error && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <Check className="h-4 w-4" />
          {success}
        </p>
      )}

      {/* Barra de herramientas */}
      <div className="rounded-xl border border-zinc-200 bg-white p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, SKU o marca…"
              className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
            />
          </div>
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400">
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
            value={filters.inv}
            onChange={(e) => navigate({ inv: e.target.value || undefined })}
            className={selectCls}
          >
            <option value="">Inventario</option>
            <option value="con">Con stock</option>
            <option value="sin">Sin stock</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            <select
              value={filters.sort}
              onChange={(e) => navigate({ sort: e.target.value === "name_asc" ? undefined : e.target.value })}
              className={selectCls}
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {hasFilters && (
              <button
                onClick={() => router.replace(pathname)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
            <Package className="h-8 w-8 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-900">Sin productos</p>
            <p className="text-sm text-zinc-500">Ajusta los filtros o crea un producto nuevo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/60 text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = !allChecked && someChecked;
                      }}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                  </th>
                  <th className="px-2 py-3 font-medium">Imagen</th>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Marca</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 text-right font-medium">Precio</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {items.map((p) => {
                  const checked = selected.has(p.id);
                  const stock = stockOf(p);
                  const isQuick = quickId === p.id;
                  return (
                    <Fragment key={p.id}>
                      <tr
                        className={`transition-colors ${checked ? "bg-zinc-50" : "hover:bg-zinc-50/60"}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOne(p.id)}
                            className="h-4 w-4 rounded border-zinc-300"
                          />
                        </td>
                        <td className="px-2 py-3">
                          <div className="h-10 w-10 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100">
                            {p.images[0]?.url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.images[0].url} alt={p.name} className="h-full w-full object-cover" />
                            )}
                          </div>
                        </td>
                        <td className="max-w-xs px-4 py-3">
                          <p className="truncate font-medium text-zinc-900">{p.name}</p>
                          {p.subtitle && <p className="truncate text-xs text-zinc-400">{p.subtitle}</p>}
                        </td>
                        <td className="px-4 py-3 text-zinc-500">{p.sku ?? "—"}</td>
                        <td className="px-4 py-3 text-zinc-600">{p.brand?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-zinc-600">
                          {p.category?.name ?? "—"}
                          {p.subcategory?.name && <span className="text-zinc-400"> / {p.subcategory.name}</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-zinc-900">{formatPrice(p.price)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={stock > 0 ? "text-zinc-700" : "text-amber-600"}>{stock}</span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge published={p.isPublished} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setQuickId(isQuick ? null : p.id)}
                              title="Edición rápida"
                              className={`grid h-8 w-8 place-items-center rounded-lg border text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 ${
                                isQuick ? "border-zinc-400 bg-zinc-50" : "border-zinc-200"
                              }`}
                            >
                              <SlidersHorizontal className="h-4 w-4" />
                            </button>
                            <Link
                              href={`/admin/productos/${p.id}/editar`}
                              title="Editar producto"
                              className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                            >
                              <SquarePen className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => togglePublish(p)}
                              disabled={pending}
                              title={p.isPublished ? "Ocultar" : "Publicar"}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50"
                            >
                              {p.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isQuick && (
                        <tr className="bg-zinc-50/80">
                          <td colSpan={10} className="px-4 py-4">
                            <QuickEdit
                              product={p}
                              brands={brands}
                              branches={branches}
                              pending={pending}
                              onCancel={() => setQuickId(null)}
                              onSave={(draft) => {
                                setError(null);
                                startTransition(async () => {
                                  const r1 = await quickUpdateProduct(p.id, {
                                    price: draft.price,
                                    brandId: draft.brandId,
                                    isPublished: draft.isPublished,
                                  });
                                  if (!r1.ok) return setError(r1.error);
                                  const r2 = await updateProductInventory(p.id, draft.inventory);
                                  if (!r2.ok) return setError(r2.error);
                                  flash("Producto actualizado.");
                                  setQuickId(null);
                                  router.refresh();
                                });
                              }}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {items.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3 sm:flex-row">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>Por página</span>
              <select
                value={filters.per}
                onChange={(e) => navigate({ per: e.target.value === "25" ? undefined : e.target.value })}
                className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:outline-none"
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
                className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-xs text-zinc-500">
                {result.page} / {totalPages}
              </span>
              <button
                onClick={() => navigate({ page: String(result.page + 1) }, true)}
                disabled={result.page >= totalPages}
                className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barra flotante de acciones masivas */}
      {selectedIds.length > 0 && (
        <div className="fixed inset-x-0 bottom-5 z-[70] flex justify-center px-4">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 shadow-2xl">
            <span className="px-1.5 text-sm font-medium text-zinc-900">{selectedIds.length} seleccionado(s)</span>
            <span className="h-5 w-px bg-zinc-200" />
            <BulkBtn onClick={() => runBulk(() => bulkSetPublished(selectedIds, true), "publicado(s)")} disabled={pending}>
              <Eye className="h-3.5 w-3.5" />
              Publicar
            </BulkBtn>
            <BulkBtn onClick={() => runBulk(() => bulkSetPublished(selectedIds, false), "ocultado(s)")} disabled={pending}>
              <EyeOff className="h-3.5 w-3.5" />
              Ocultar
            </BulkBtn>
            <BulkBtn onClick={() => setModal("brand")} disabled={pending}>
              <Tag className="h-3.5 w-3.5" />
              Cambiar marca
            </BulkBtn>
            <BulkBtn onClick={() => setModal("category")} disabled={pending}>
              <Package className="h-3.5 w-3.5" />
              Cambiar categoría
            </BulkBtn>
            <BulkBtn onClick={() => setModal("delete")} disabled={pending} danger>
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </BulkBtn>
            <button
              onClick={() => setSelected(new Set())}
              className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modales bulk */}
      {modal === "brand" && (
        <BulkBrandModal
          brands={brands}
          pending={pending}
          onClose={() => setModal(null)}
          onConfirm={(brandId) => runBulk(() => bulkSetBrand(selectedIds, brandId), "actualizado(s)")}
        />
      )}
      {modal === "category" && (
        <BulkCategoryModal
          categories={categories}
          pending={pending}
          onClose={() => setModal(null)}
          onConfirm={(catId, subId) => runBulk(() => bulkSetCategory(selectedIds, catId, subId), "actualizado(s)")}
        />
      )}
      {modal === "delete" && (
        <Modal title="Eliminar productos" onClose={() => setModal(null)}>
          <div className="space-y-3 p-5">
            <p className="text-sm text-zinc-600">
              Vas a eliminar <span className="font-semibold text-zinc-900">{selectedIds.length}</span> producto(s) de
              forma definitiva. Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-3">
            <button
              onClick={() => setModal(null)}
              disabled={pending}
              className="h-9 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => runBulk(() => bulkDeleteProducts(selectedIds), "eliminado(s)")}
              disabled={pending}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Eliminar definitivamente
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatusBadge({ published }: { published: boolean }) {
  return published ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Publicado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
      Oculto
    </span>
  );
}

function BulkBtn({
  onClick,
  disabled,
  danger,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors disabled:opacity-50 ${
        danger
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      {children}
    </button>
  );
}

type QuickDraft = {
  price: number;
  brandId: string;
  isPublished: boolean;
  inventory: { branchId: string; quantity: number }[];
};

function QuickEdit({
  product,
  brands,
  branches,
  pending,
  onCancel,
  onSave,
}: {
  product: CatalogProduct;
  brands: CatalogBrand[];
  branches: CatalogBranch[];
  pending: boolean;
  onCancel: () => void;
  onSave: (draft: QuickDraft) => void;
}) {
  const initialStock = useMemo(() => {
    const m: Record<string, string> = {};
    for (const b of branches) {
      const found = product.inventory.find((i) => i.branch.id === b.id);
      m[b.id] = String(found?.quantity ?? 0);
    }
    return m;
  }, [product, branches]);

  const [price, setPrice] = useState(String(product.price));
  const [brandId, setBrandId] = useState(product.brand?.id ?? "");
  const [isPublished, setIsPublished] = useState(product.isPublished);
  const [stock, setStock] = useState<Record<string, string>>(initialStock);

  const save = () => {
    onSave({
      price: Math.max(0, Math.round(Number(price) || 0)),
      brandId: brandId || (product.brand?.id ?? ""),
      isPublished,
      inventory: branches.map((b) => ({
        branchId: b.id,
        quantity: Math.max(0, Math.round(Number(stock[b.id]) || 0)),
      })),
    });
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
        <p className="text-sm font-semibold text-zinc-900">Edición rápida</p>
        <span className="truncate text-xs text-zinc-400">· {product.name}</span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Precio (MXN)</span>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Marca</span>
          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Estado</span>
          <button
            type="button"
            onClick={() => setIsPublished((v) => !v)}
            className={`flex h-9 w-full items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${
              isPublished
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-white text-zinc-600"
            }`}
          >
            {isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {isPublished ? "Publicado" : "Oculto"}
          </button>
        </label>
      </div>

      {branches.length > 0 && (
        <div className="mt-3">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Stock por sucursal</span>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {branches.map((b) => (
              <label key={b.id} className="block">
                <span className="mb-1 block text-[11px] text-zinc-400">{b.displayName || b.name}</span>
                <input
                  type="number"
                  min={0}
                  value={stock[b.id] ?? "0"}
                  onChange={(e) => setStock((prev) => ({ ...prev, [b.id]: e.target.value }))}
                  className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={save}
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar
        </button>
        <button
          onClick={onCancel}
          disabled={pending}
          className="h-9 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function BulkBrandModal({
  brands,
  pending,
  onClose,
  onConfirm,
}: {
  brands: CatalogBrand[];
  pending: boolean;
  onClose: () => void;
  onConfirm: (brandId: string) => void;
}) {
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  return (
    <Modal title="Cambiar marca" onClose={onClose}>
      <div className="space-y-3 p-5">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Nueva marca</span>
          <select
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-3">
        <button
          onClick={onClose}
          disabled={pending}
          className="h-9 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Cancelar
        </button>
        <button
          onClick={() => onConfirm(brandId)}
          disabled={pending || !brandId}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Aplicar
        </button>
      </div>
    </Modal>
  );
}

function BulkCategoryModal({
  categories,
  pending,
  onClose,
  onConfirm,
}: {
  categories: CatalogCategoryTree[];
  pending: boolean;
  onClose: () => void;
  onConfirm: (categoryId: string, subcategoryId: string | null) => void;
}) {
  const [catId, setCatId] = useState(categories[0]?.id ?? "");
  const [subId, setSubId] = useState("");
  const cat = categories.find((c) => c.id === catId);

  return (
    <Modal title="Cambiar categoría" onClose={onClose}>
      <div className="space-y-3 p-5">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Categoría</span>
          <select
            value={catId}
            onChange={(e) => {
              setCatId(e.target.value);
              setSubId("");
            }}
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-600">
            Subcategoría <span className="text-zinc-400">(opcional)</span>
          </span>
          <select
            value={subId}
            onChange={(e) => setSubId(e.target.value)}
            disabled={!cat?.subcategories.length}
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100 disabled:opacity-50"
          >
            <option value="">Sin subcategoría</option>
            {cat?.subcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-3">
        <button
          onClick={onClose}
          disabled={pending}
          className="h-9 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Cancelar
        </button>
        <button
          onClick={() => onConfirm(catId, subId || null)}
          disabled={pending || !catId}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Aplicar
        </button>
      </div>
    </Modal>
  );
}
