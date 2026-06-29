"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  Layers,
  Loader2,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  SquarePen,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { formatPrice } from "@/lib/catalog/format";
import type {
  AdminCategory,
  AdminSubcategory,
  CategorizableProduct,
} from "@/lib/admin/category-queries";
import {
  assignProductsToCategory,
  assignProductsToSubcategory,
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  removeProductFromSubcategory,
  reorderCategories,
  reorderSubcategories,
  setCategoryActive,
  setSubcategoryActive,
  updateCategory,
  updateSubcategory,
  type CategoryInput,
  type SubcategoryInput,
} from "@/lib/admin/category-actions";

type FieldErrors = Record<string, string[]>;
type Selected = { type: "category"; id: string } | { type: "subcategory"; id: string };
type CatForm = { id: string | null; name: string; slug: string; description: string; isActive: boolean };
type SubForm = {
  id: string | null;
  categoryId: string;
  name: string;
  slug: string;
  isActive: boolean;
};
type AssignTarget =
  | { kind: "category"; categoryId: string; label: string }
  | { kind: "subcategory"; categoryId: string; subcategoryId: string; label: string };

const inputBase =
  "h-9 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2";
const inputOk = "border-zinc-200 focus:border-zinc-400 focus:ring-zinc-100";
const inputErr = "border-red-300 focus:border-red-400 focus:ring-red-100";
const inputCls = (err: boolean) => `${inputBase} ${err ? inputErr : inputOk}`;

const PUBLISH_NOTE = "Los productos asignados aparecerán en el catálogo público según su estado de publicación.";
const HIDE_NOTE = "Ocultar una categoría la retira del menú y filtros públicos, pero no elimina sus productos.";

function StatusPill({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Activa
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
      Oculta
    </span>
  );
}

/** Botón de ícono discreto para acciones en el árbol. */
function IconBtn({
  onClick,
  disabled,
  title,
  danger,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={`grid h-6 w-6 place-items-center rounded-md text-zinc-400 transition-colors disabled:opacity-20 ${
        danger ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-white hover:text-zinc-800"
      } disabled:hover:bg-transparent disabled:hover:text-zinc-400`}
    >
      {children}
    </button>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-900/40 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className={`mt-6 w-full ${wide ? "max-w-2xl" : "max-w-lg"} rounded-2xl border border-zinc-200 bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function CategoriesManager({
  initial,
  products,
}: {
  initial: AdminCategory[];
  products: CategorizableProduct[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Selected | null>(() => {
    const sorted = [...initial].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted[0] ? { type: "category", id: sorted[0].id } : null;
  });
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const sorted = [...initial].sort((a, b) => a.sortOrder - b.sortOrder);
    return new Set(sorted[0] ? [sorted[0].id] : []);
  });
  const [catForm, setCatForm] = useState<CatForm | null>(null);
  const [subForm, setSubForm] = useState<SubForm | null>(null);
  const [assign, setAssign] = useState<AssignTarget | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const ordered = useMemo(
    () => [...initial].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [initial],
  );

  const treeList = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ordered;
    return ordered.filter((c) =>
      `${c.name} ${c.slug} ${c.subcategories.map((s) => s.name).join(" ")}`
        .toLowerCase()
        .includes(q),
    );
  }, [ordered, query]);

  const productsByCategory = useMemo(() => {
    const m = new Map<string, CategorizableProduct[]>();
    for (const p of products) {
      if (!p.categoryId) continue;
      const list = m.get(p.categoryId) ?? [];
      list.push(p);
      m.set(p.categoryId, list);
    }
    return m;
  }, [products]);

  const productsBySubcategory = useMemo(() => {
    const m = new Map<string, CategorizableProduct[]>();
    for (const p of products) {
      if (!p.subcategoryId) continue;
      const list = m.get(p.subcategoryId) ?? [];
      list.push(p);
      m.set(p.subcategoryId, list);
    }
    return m;
  }, [products]);

  const selectedCategory =
    selected?.type === "category" ? ordered.find((c) => c.id === selected.id) : undefined;
  const selectedSubInfo =
    selected?.type === "subcategory"
      ? (() => {
          for (const c of ordered) {
            const s = c.subcategories.find((x) => x.id === selected.id);
            if (s) return { category: c, sub: s };
          }
          return undefined;
        })()
      : undefined;

  const canReorderCats = !query.trim();

  const resetFeedback = () => {
    setError(null);
    setSuccess(null);
    setFieldErrors({});
  };
  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess((s) => (s === msg ? null : s)), 3000);
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // ── Forms ──
  const openCreateCat = () => {
    resetFeedback();
    setCatForm({ id: null, name: "", slug: "", description: "", isActive: true });
  };
  const openEditCat = (c: AdminCategory) => {
    resetFeedback();
    setCatForm({ id: c.id, name: c.name, slug: c.slug, description: c.description ?? "", isActive: c.isActive });
  };
  const submitCat = () => {
    if (!catForm) return;
    setFieldErrors({});
    setError(null);
    const payload: CategoryInput = {
      name: catForm.name,
      slug: catForm.slug || undefined,
      description: catForm.description || null,
      isActive: catForm.isActive,
    };
    startTransition(async () => {
      const res = catForm.id ? await updateCategory(catForm.id, payload) : await createCategory(payload);
      if (!res.ok) {
        setError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        return;
      }
      if (!catForm.id && res.data) setSelected({ type: "category", id: res.data.id });
      flash(catForm.id ? "Categoría actualizada." : "Categoría creada.");
      setCatForm(null);
      router.refresh();
    });
  };

  const openCreateSub = (categoryId: string) => {
    resetFeedback();
    setSubForm({ id: null, categoryId, name: "", slug: "", isActive: true });
  };
  const openEditSub = (s: AdminSubcategory) => {
    resetFeedback();
    setSubForm({ id: s.id, categoryId: s.categoryId, name: s.name, slug: s.slug, isActive: s.isActive });
  };
  const submitSub = () => {
    if (!subForm) return;
    setFieldErrors({});
    setError(null);
    const payload: SubcategoryInput = {
      categoryId: subForm.categoryId,
      name: subForm.name,
      slug: subForm.slug || undefined,
      isActive: subForm.isActive,
    };
    startTransition(async () => {
      const res = subForm.id ? await updateSubcategory(subForm.id, payload) : await createSubcategory(payload);
      if (!res.ok) {
        setError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        return;
      }
      setExpanded((prev) => new Set(prev).add(subForm.categoryId));
      if (!subForm.id && res.data) setSelected({ type: "subcategory", id: res.data.id });
      flash(subForm.id ? "Subcategoría actualizada." : "Subcategoría creada.");
      setSubForm(null);
      router.refresh();
    });
  };

  // ── Quick actions ──
  const run = (id: string, fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => {
    resetFeedback();
    setBusyId(id);
    startTransition(async () => {
      const res = await fn();
      setBusyId(null);
      if (!res.ok) {
        setError(res.error ?? "Ocurrió un error.");
        return;
      }
      flash(okMsg);
      router.refresh();
    });
  };

  const toggleCat = (c: AdminCategory) =>
    run(c.id, () => setCategoryActive(c.id, !c.isActive), c.isActive ? "Categoría oculta." : "Categoría activada.");
  const deleteCat = (c: AdminCategory) => {
    if (c.productCount > 0 || c.subcategories.length > 0) return;
    if (window.confirm(`¿Eliminar la categoría "${c.name}"?`)) {
      run(c.id, () => deleteCategory(c.id), "Categoría eliminada.");
      if (selected?.type === "category" && selected.id === c.id) setSelected(null);
    }
  };
  const toggleSub = (s: AdminSubcategory) =>
    run(
      s.id,
      () => setSubcategoryActive(s.id, !s.isActive),
      s.isActive ? "Subcategoría oculta." : "Subcategoría activada.",
    );
  const deleteSub = (s: AdminSubcategory) => {
    if (s.productCount > 0) return;
    if (window.confirm(`¿Eliminar la subcategoría "${s.name}"?`)) {
      run(s.id, () => deleteSubcategory(s.id), "Subcategoría eliminada.");
      if (selected?.type === "subcategory" && selected.id === s.id) {
        setSelected({ type: "category", id: s.categoryId });
      }
    }
  };

  const moveCat = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= ordered.length) return;
    const ids = ordered.map((c) => c.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    resetFeedback();
    startTransition(async () => {
      const res = await reorderCategories(ids);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  };
  const moveSub = (cat: AdminCategory, index: number, dir: -1 | 1) => {
    const subs = [...cat.subcategories].sort((a, b) => a.sortOrder - b.sortOrder);
    const target = index + dir;
    if (target < 0 || target >= subs.length) return;
    const ids = subs.map((s) => s.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    resetFeedback();
    startTransition(async () => {
      const res = await reorderSubcategories(cat.id, ids);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  };

  const removeFromSub = (productId: string) =>
    run(productId, () => removeProductFromSubcategory(productId), "Producto quitado de la subcategoría.");

  return (
    <div>
      {/* Feedback */}
      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <Check className="h-4 w-4" />
          {success}
        </p>
      )}

      <div className="grid items-start gap-5 md:grid-cols-[300px_1fr]">
        {/* ───────── Lista compacta de categorías ───────── */}
        <aside className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar…"
                className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
              />
            </div>
            <button
              onClick={openCreateCat}
              className="mt-2 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
              Nueva categoría
            </button>
          </div>

          <nav className="max-h-[70vh] overflow-y-auto p-2">
            {treeList.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-zinc-400">Sin resultados.</p>
            ) : (
              <ul className="space-y-0.5">
                {treeList.map((c) => {
                  const index = ordered.findIndex((x) => x.id === c.id);
                  const isOpen = expanded.has(c.id);
                  const isSel = selected?.type === "category" && selected.id === c.id;
                  const subs = [...c.subcategories].sort((a, b) => a.sortOrder - b.sortOrder);
                  return (
                    <li key={c.id}>
                      <div
                        className={`group flex items-center gap-1 rounded-lg pr-1 ${
                          isSel ? "bg-zinc-100 ring-1 ring-zinc-200" : "hover:bg-zinc-50"
                        }`}
                      >
                        <button
                          onClick={() => toggleExpand(c.id)}
                          className="grid h-7 w-6 shrink-0 place-items-center rounded text-zinc-400 hover:text-zinc-700"
                          title={isOpen ? "Contraer" : "Expandir"}
                        >
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => setSelected({ type: "category", id: c.id })}
                          className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                              c.isActive ? "bg-emerald-500" : "bg-zinc-300"
                            }`}
                          />
                          <span className="truncate text-sm font-medium text-zinc-800">{c.name}</span>
                        </button>
                        <span className="shrink-0 text-xs tabular-nums text-zinc-400">{c.productCount}</span>
                        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                          <IconBtn
                            onClick={() => moveCat(index, -1)}
                            disabled={!canReorderCats || index === 0 || pending}
                            title="Subir"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </IconBtn>
                          <IconBtn
                            onClick={() => moveCat(index, 1)}
                            disabled={!canReorderCats || index === ordered.length - 1 || pending}
                            title="Bajar"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </IconBtn>
                        </div>
                      </div>

                      {isOpen && (
                        <ul className="mb-1 ml-3 mt-0.5 space-y-0.5 border-l border-zinc-100 pl-2">
                          {subs.map((s, si) => {
                            const isSubSel = selected?.type === "subcategory" && selected.id === s.id;
                            return (
                              <li
                                key={s.id}
                                className={`group flex items-center gap-1 rounded-lg pr-1 ${
                                  isSubSel ? "bg-zinc-100 ring-1 ring-zinc-200" : "hover:bg-zinc-50"
                                }`}
                              >
                                <button
                                  onClick={() => setSelected({ type: "subcategory", id: s.id })}
                                  className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pl-2 text-left"
                                >
                                  <span
                                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                      s.isActive ? "bg-emerald-500" : "bg-zinc-300"
                                    }`}
                                  />
                                  <span className="truncate text-sm text-zinc-600">{s.name}</span>
                                </button>
                                <span className="shrink-0 text-[11px] tabular-nums text-zinc-400">
                                  {s.productCount}
                                </span>
                                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                                  <IconBtn onClick={() => moveSub(c, si, -1)} disabled={si === 0 || pending} title="Subir">
                                    <ArrowUp className="h-3 w-3" />
                                  </IconBtn>
                                  <IconBtn
                                    onClick={() => moveSub(c, si, 1)}
                                    disabled={si === subs.length - 1 || pending}
                                    title="Bajar"
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </IconBtn>
                                </div>
                              </li>
                            );
                          })}
                          <li>
                            <button
                              onClick={() => openCreateSub(c.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Subcategoría
                            </button>
                          </li>
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </nav>
        </aside>

        {/* ───────── Panel de detalle ───────── */}
        <section className="min-w-0">
          {selectedCategory ? (
          <CategoryDetail
            category={selectedCategory}
            products={productsByCategory.get(selectedCategory.id) ?? []}
            onEdit={() => openEditCat(selectedCategory)}
            onToggle={() => toggleCat(selectedCategory)}
            onDelete={() => deleteCat(selectedCategory)}
            onSelectSub={(id) => setSelected({ type: "subcategory", id })}
            onNewSub={() => openCreateSub(selectedCategory.id)}
            busy={busyId === selectedCategory.id && pending}
            onAssign={() =>
              setAssign({ kind: "category", categoryId: selectedCategory.id, label: selectedCategory.name })
            }
          />
        ) : selectedSubInfo ? (
          <SubcategoryDetail
            category={selectedSubInfo.category}
            sub={selectedSubInfo.sub}
            products={productsBySubcategory.get(selectedSubInfo.sub.id) ?? []}
            busy={busyId === selectedSubInfo.sub.id && pending}
            onEdit={() => openEditSub(selectedSubInfo.sub)}
            onToggle={() => toggleSub(selectedSubInfo.sub)}
            onDelete={() => deleteSub(selectedSubInfo.sub)}
            onBack={() => setSelected({ type: "category", id: selectedSubInfo.category.id })}
            onAssign={() =>
              setAssign({
                kind: "subcategory",
                categoryId: selectedSubInfo.category.id,
                subcategoryId: selectedSubInfo.sub.id,
                label: `${selectedSubInfo.category.name} / ${selectedSubInfo.sub.name}`,
              })
            }
            onRemoveFromSub={removeFromSub}
          />
        ) : (
          <div className="grid min-h-[220px] place-items-center rounded-xl border border-dashed border-zinc-200 bg-white">
            <div className="max-w-xs text-center">
              <Layers className="mx-auto h-8 w-8 text-zinc-300" />
              <p className="mt-2 text-sm font-medium text-zinc-900">
                Selecciona una categoría para administrar sus productos.
              </p>
              <p className="mt-1 text-sm text-zinc-500">{PUBLISH_NOTE}</p>
            </div>
          </div>
        )}
        </section>
      </div>

      {/* ───────── Modal: categoría ───────── */}
      {catForm && (
        <Modal title={catForm.id ? "Editar categoría" : "Nueva categoría"} onClose={() => setCatForm(null)}>
          <div className="space-y-4 p-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">Nombre *</label>
              <input
                autoFocus
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                placeholder="Instrumentos"
                className={inputCls(Boolean(fieldErrors.name))}
              />
              {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name[0]}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Slug <span className="text-zinc-400">(opcional)</span>
              </label>
              <input
                value={catForm.slug}
                onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                placeholder="instrumentos"
                className={inputCls(Boolean(fieldErrors.slug))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Descripción <span className="text-zinc-400">(opcional)</span>
              </label>
              <textarea
                value={catForm.description}
                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={catForm.isActive}
                onChange={(e) => setCatForm({ ...catForm, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-300"
              />
              Categoría activa (visible en el sitio)
            </label>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-3">
            <button
              onClick={() => setCatForm(null)}
              disabled={pending}
              className="h-9 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              onClick={submitCat}
              disabled={pending}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {catForm.id ? "Guardar cambios" : "Crear categoría"}
            </button>
          </div>
        </Modal>
      )}

      {/* ───────── Modal: subcategoría ───────── */}
      {subForm && (
        <Modal
          title={subForm.id ? "Editar subcategoría" : "Nueva subcategoría"}
          subtitle={ordered.find((c) => c.id === subForm.categoryId)?.name}
          onClose={() => setSubForm(null)}
        >
          <div className="space-y-4 p-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">Categoría padre</label>
              <select
                value={subForm.categoryId}
                onChange={(e) => setSubForm({ ...subForm, categoryId: e.target.value })}
                className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
              >
                {ordered.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">Nombre *</label>
              <input
                autoFocus
                value={subForm.name}
                onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                placeholder="Guitarras eléctricas"
                className={inputCls(Boolean(fieldErrors.name))}
              />
              {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name[0]}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Slug <span className="text-zinc-400">(opcional)</span>
              </label>
              <input
                value={subForm.slug}
                onChange={(e) => setSubForm({ ...subForm, slug: e.target.value })}
                placeholder="guitarras-electricas"
                className={inputCls(Boolean(fieldErrors.slug))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={subForm.isActive}
                onChange={(e) => setSubForm({ ...subForm, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-300"
              />
              Subcategoría activa
            </label>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-3">
            <button
              onClick={() => setSubForm(null)}
              disabled={pending}
              className="h-9 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              onClick={submitSub}
              disabled={pending}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {subForm.id ? "Guardar cambios" : "Crear subcategoría"}
            </button>
          </div>
        </Modal>
      )}

      {/* ───────── Modal: asignar productos ───────── */}
      {assign && (
        <AssignModal
          target={assign}
          products={products}
          pending={pending}
          onClose={() => setAssign(null)}
          onSubmit={(ids) => {
            setError(null);
            startTransition(async () => {
              const res =
                assign.kind === "category"
                  ? await assignProductsToCategory(assign.categoryId, ids)
                  : await assignProductsToSubcategory(assign.categoryId, assign.subcategoryId, ids);
              if (!res.ok) {
                setError(res.error);
                return;
              }
              flash(`${res.data.count} producto(s) asignado(s).`);
              setAssign(null);
              router.refresh();
            });
          }}
        />
      )}
    </div>
  );
}

// ───────────────────────── Detalle: categoría ─────────────────────────

function CategoryDetail({
  category,
  products,
  busy,
  onEdit,
  onToggle,
  onDelete,
  onSelectSub,
  onNewSub,
  onAssign,
}: {
  category: AdminCategory;
  products: CategorizableProduct[];
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onSelectSub: (id: string) => void;
  onNewSub: () => void;
  onAssign: () => void;
}) {
  const subs = [...category.subcategories].sort((a, b) => a.sortOrder - b.sortOrder);
  const canDelete = category.productCount === 0 && subs.length === 0;
  const direct = products.filter((p) => p.subcategoryId === null).length;

  return (
    <div className="space-y-5">
      <DetailHeader
        breadcrumb="Categoría"
        name={category.name}
        slug={category.slug}
        active={category.isActive}
        busy={busy}
        canDelete={canDelete}
        deleteHint={
          category.productCount > 0
            ? "Tiene productos asociados"
            : subs.length > 0
              ? "Tiene subcategorías"
              : undefined
        }
        onEdit={onEdit}
        onToggle={onToggle}
        onDelete={onDelete}
      />

      {category.description && (
        <p className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
          {category.description}
        </p>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Productos totales" value={products.length} />
        <Stat label="Productos directos" value={direct} />
        <Stat label="Subcategorías" value={subs.length} />
      </div>

      <p className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
        {HIDE_NOTE}
      </p>

      {/* Subcategorías */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">
            Subcategorías <span className="text-zinc-400">({subs.length})</span>
          </h3>
          <button
            onClick={onNewSub}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva subcategoría
          </button>
        </div>
        {subs.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-400">Aún no hay subcategorías.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {subs.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectSub(s.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-400"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${s.isActive ? "bg-emerald-500" : "bg-zinc-300"}`} />
                {s.name}
                <span className="text-zinc-400">{s.productCount}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <ProductPanel title="Productos en esta categoría" products={products} onAssign={onAssign} />
    </div>
  );
}

// ──────────────────────── Detalle: subcategoría ────────────────────────

function SubcategoryDetail({
  category,
  sub,
  products,
  busy,
  onEdit,
  onToggle,
  onDelete,
  onBack,
  onAssign,
  onRemoveFromSub,
}: {
  category: AdminCategory;
  sub: AdminSubcategory;
  products: CategorizableProduct[];
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onBack: () => void;
  onAssign: () => void;
  onRemoveFromSub: (productId: string) => void;
}) {
  return (
    <div className="space-y-5">
      <DetailHeader
        breadcrumb={
          <button onClick={onBack} className="hover:text-zinc-700 hover:underline">
            {category.name}
          </button>
        }
        name={sub.name}
        slug={sub.slug}
        active={sub.isActive}
        busy={busy}
        canDelete={sub.productCount === 0}
        deleteHint={sub.productCount > 0 ? "Tiene productos asociados" : undefined}
        onEdit={onEdit}
        onToggle={onToggle}
        onDelete={onDelete}
      />
      <ProductPanel
        title="Productos en esta subcategoría"
        products={products}
        onAssign={onAssign}
        onRemoveFromSub={onRemoveFromSub}
      />
    </div>
  );
}

// ───────────────────────── Subcomponentes UI ─────────────────────────

function Stat({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
      <p className={`font-semibold tracking-tight text-zinc-900 ${small ? "truncate text-base" : "text-2xl"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function DetailHeader({
  breadcrumb,
  name,
  slug,
  active,
  busy,
  canDelete,
  deleteHint,
  onEdit,
  onToggle,
  onDelete,
}: {
  breadcrumb: React.ReactNode;
  name: string;
  slug: string;
  active: boolean;
  busy: boolean;
  canDelete: boolean;
  deleteHint?: string;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{breadcrumb}</p>
          <div className="mt-1 flex items-center gap-2.5">
            <h2 className="truncate text-xl font-semibold tracking-tight text-zinc-900">{name}</h2>
            <StatusPill active={active} />
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">/{slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>
          <button
            onClick={onToggle}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : active ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {active ? "Ocultar" : "Activar"}
          </button>
          <button
            onClick={onDelete}
            disabled={!canDelete || busy}
            title={deleteHint ?? "Eliminar"}
            className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductPanel({
  title,
  products,
  onAssign,
  onRemoveFromSub,
}: {
  title: string;
  products: CategorizableProduct[];
  onAssign: () => void;
  onRemoveFromSub?: (productId: string) => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            {title} <span className="text-zinc-400">({products.length})</span>
          </h3>
          <p className="mt-0.5 hidden text-xs text-zinc-400 sm:block">{PUBLISH_NOTE}</p>
        </div>
        <button
          onClick={onAssign}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <PackagePlus className="h-4 w-4" />
          Asignar productos
        </button>
      </div>
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
          <Tag className="h-7 w-7 text-zinc-300" />
          <p className="text-sm text-zinc-500">No hay productos aquí todavía.</p>
          <button onClick={onAssign} className="text-sm font-medium text-zinc-900 underline-offset-2 hover:underline">
            Asignar productos existentes
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50/60">
              <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <Tag className="h-4 w-4 text-zinc-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">{p.name}</p>
                <p className="truncate text-xs text-zinc-400">
                  {p.brandName ?? "Sin marca"} · {formatPrice(p.price)}
                </p>
              </div>
              {!p.isPublished && (
                <span className="hidden shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 sm:inline">
                  Borrador
                </span>
              )}
              <div className="flex shrink-0 items-center gap-1">
                {onRemoveFromSub && (
                  <button
                    onClick={() => onRemoveFromSub(p.id)}
                    title="Quitar de la subcategoría"
                    className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <Link
                  href={`/admin/productos/${p.id}/editar`}
                  title="Editar producto"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                >
                  <SquarePen className="h-4 w-4" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AssignModal({
  target,
  products,
  pending,
  onClose,
  onSubmit,
}: {
  target: AssignTarget;
  products: CategorizableProduct[];
  pending: boolean;
  onClose: () => void;
  onSubmit: (ids: string[]) => void;
}) {
  const alreadyHere = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (target.kind === "category") {
        if (p.categoryId === target.categoryId && p.subcategoryId === null) set.add(p.id);
      } else if (p.subcategoryId === target.subcategoryId) {
        set.add(p.id);
      }
    }
    return set;
  }, [products, target]);

  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(() => new Set());

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products
      .filter((p) => !term || `${p.name} ${p.brandName ?? ""}`.toLowerCase().includes(term))
      .slice(0, 200);
  }, [products, q]);

  const toggle = (id: string) => {
    if (alreadyHere.has(id)) return;
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const count = picked.size;

  return (
    <Modal title="Asignar productos" subtitle={target.label} onClose={onClose} wide>
      <div className="border-b border-zinc-100 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar producto por nombre o marca…"
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
          />
        </div>
      </div>

      <ul className="max-h-[50vh] divide-y divide-zinc-100 overflow-y-auto">
        {filtered.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-zinc-400">Sin resultados.</li>
        ) : (
          filtered.map((p) => {
            const here = alreadyHere.has(p.id);
            const checked = here || picked.has(p.id);
            const location = p.subcategoryName ?? p.categoryName ?? "Sin categoría";
            return (
              <li key={p.id}>
                <label
                  className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 ${
                    here ? "opacity-60" : "hover:bg-zinc-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={here}
                    onChange={() => toggle(p.id)}
                    className="h-4 w-4 shrink-0 rounded border-zinc-300"
                  />
                  <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <Tag className="h-3.5 w-3.5 text-zinc-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">{p.name}</p>
                    <p className="truncate text-xs text-zinc-400">
                      {p.brandName ?? "Sin marca"} · {formatPrice(p.price)}
                      <span className="text-zinc-300"> · </span>
                      <span className="text-zinc-500">{location}</span>
                    </p>
                  </div>
                  {here && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      Ya aquí
                    </span>
                  )}
                </label>
              </li>
            );
          })
        )}
      </ul>

      <div className="flex items-center justify-between gap-2 border-t border-zinc-100 px-5 py-3">
        <p className="text-xs text-zinc-500">{count} seleccionado(s)</p>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            disabled={pending}
            className="h-9 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSubmit([...picked])}
            disabled={pending || count === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Asignar{count > 0 ? ` ${count}` : ""}
          </button>
        </div>
      </div>
    </Modal>
  );
}
