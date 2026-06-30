"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import type { AdminBrand } from "@/lib/admin/brand-queries";
import {
  createBrand,
  deleteBrand,
  reorderBrands,
  setBrandActive,
  updateBrand,
  type BrandInput,
} from "@/lib/admin/brand-actions";
import { AdminButton } from "@/components/admin/admin-button";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { adminShell } from "@/lib/design/admin-shell";
import { cn } from "@/lib/utils";

type FieldErrors = Record<string, string[]>;
type Filter = "todas" | "activas" | "ocultas";

const inputBase = cn(adminShell.input, "h-9 w-full");
const inputOk = "";
const inputErr = "border-red-300 focus:border-red-400 focus:ring-red-100";
const inputCls = (err: boolean) => cn(inputBase, err ? inputErr : "");

type FormState = {
  id: string | null;
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  id: null,
  name: "",
  slug: "",
  logoUrl: "",
  description: "",
  isActive: true,
};

export function BrandsManager({ initial }: { initial: AdminBrand[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todas");
  const [form, setForm] = useState<FormState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Orden canónico por sort_order (para reordenar).
  const ordered = useMemo(
    () => [...initial].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [initial],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ordered.filter((b) => {
      if (filter === "activas" && !b.isActive) return false;
      if (filter === "ocultas" && b.isActive) return false;
      if (q && !`${b.name} ${b.slug}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [ordered, query, filter]);

  const resetFeedback = () => {
    setError(null);
    setSuccess(null);
    setFieldErrors({});
  };

  const openCreate = () => {
    resetFeedback();
    setForm({ ...emptyForm });
  };

  const openEdit = (b: AdminBrand) => {
    resetFeedback();
    setForm({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoUrl: b.logoUrl ?? "",
      description: b.description ?? "",
      isActive: b.isActive,
    });
  };

  const closeForm = () => {
    setForm(null);
    resetFeedback();
  };

  const submit = () => {
    if (!form) return;
    resetFeedback();
    const payload: BrandInput = {
      name: form.name,
      slug: form.slug || undefined,
      description: form.description || null,
      logoUrl: form.logoUrl || null,
      isActive: form.isActive,
    };
    startTransition(async () => {
      const res = form.id
        ? await updateBrand(form.id, payload)
        : await createBrand(payload);
      if (!res.ok) {
        setError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        return;
      }
      setSuccess(form.id ? "Marca actualizada." : "Marca creada.");
      setForm(null);
      router.refresh();
    });
  };

  const toggleActive = (b: AdminBrand) => {
    resetFeedback();
    setBusyId(b.id);
    startTransition(async () => {
      const res = await setBrandActive(b.id, !b.isActive);
      setBusyId(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(b.isActive ? "Marca oculta." : "Marca activada.");
      router.refresh();
    });
  };

  const remove = (b: AdminBrand) => {
    if (b.productCount > 0) return;
    if (!window.confirm(`¿Eliminar la marca "${b.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    resetFeedback();
    setBusyId(b.id);
    startTransition(async () => {
      const res = await deleteBrand(b.id);
      setBusyId(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess("Marca eliminada.");
      router.refresh();
    });
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= ordered.length) return;
    const ids = ordered.map((b) => b.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    resetFeedback();
    startTransition(async () => {
      const res = await reorderBrands(ids);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const canReorder = filter === "todas" && !query.trim();

  return (
    <div>
      {/* Toolbar */}
      <div className={cn(adminShell.cardToolbar, "flex flex-wrap items-center justify-between gap-3")}>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar marca…"
            className={cn(adminShell.input, "w-56")}
          />
          <div className={cn("flex items-center gap-1 rounded-lg border p-0.5", adminShell.dividerSoft, "bg-card")}>
            {(["todas", "activas", "ocultas"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                  filter === f
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted/50",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <AdminButton type="button" onClick={openCreate} variant="primary">
          <Plus className="h-4 w-4" />
          Nueva marca
        </AdminButton>
      </div>

      {/* Feedback global */}
      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && !form && (
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <Check className="h-4 w-4" />
          {success}
        </p>
      )}

      {/* Formulario crear/editar */}
      {form && (
        <div className={cn(adminShell.cardSection, "mt-4")}>
          <div className="flex items-center justify-between">
            <h2 className={adminShell.sectionTitleSm}>
              {form.id ? "Editar marca" : "Nueva marca"}
            </h2>
            <button onClick={closeForm} className="text-zinc-400 hover:text-zinc-700">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">Nombre *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Yamaha"
                className={inputCls(Boolean(fieldErrors.name))}
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.name[0]}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Slug <span className="text-zinc-400">(opcional, se genera del nombre)</span>
              </label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="yamaha"
                className={inputCls(Boolean(fieldErrors.slug))}
              />
              {fieldErrors.slug && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.slug[0]}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                URL del logo <span className="text-zinc-400">(opcional)</span>
              </label>
              <input
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="https://…/logo.svg"
                className={inputCls(Boolean(fieldErrors.logoUrl))}
              />
              {fieldErrors.logoUrl && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.logoUrl[0]}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-700">
                Descripción <span className="text-zinc-400">(opcional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Breve descripción de la marca."
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-300"
              />
              Marca activa (visible en el sitio)
            </label>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={submit}
              disabled={pending}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {form.id ? "Guardar cambios" : "Crear marca"}
            </button>
            <button
              onClick={closeForm}
              disabled={pending}
              className="h-9 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className={cn(adminShell.card, "mt-4 overflow-hidden")}>
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Tag className="h-8 w-8 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-900">Sin marcas</p>
            <p className="text-sm text-zinc-500">Ajusta la búsqueda o crea una marca nueva.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/60 text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-3 font-medium">Orden</th>
                  <th className="px-4 py-3 font-medium">Logo</th>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 text-right font-medium">Productos</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {visible.map((b) => {
                  const index = ordered.findIndex((x) => x.id === b.id);
                  const rowBusy = busyId === b.id && pending;
                  return (
                    <tr key={b.id} className="hover:bg-zinc-50/60">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => move(index, -1)}
                            disabled={!canReorder || index === 0 || pending}
                            title={canReorder ? "Subir" : "Quita búsqueda/filtro para reordenar"}
                            className="grid h-6 w-6 place-items-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => move(index, 1)}
                            disabled={!canReorder || index === ordered.length - 1 || pending}
                            title={canReorder ? "Bajar" : "Quita búsqueda/filtro para reordenar"}
                            className="grid h-6 w-6 place-items-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
                          {b.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={b.logoUrl} alt={b.name} className="h-full w-full object-contain" />
                          ) : (
                            <Tag className="h-4 w-4 text-zinc-300" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-900">{b.name}</p>
                        {b.description && (
                          <p className="mt-0.5 max-w-xs truncate text-xs text-zinc-400">
                            {b.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{b.slug}</td>
                      <td className="px-4 py-3 text-right text-zinc-600">{b.productCount}</td>
                      <td className="px-4 py-3">
                        <AdminStatusBadge tone={b.isActive ? "active" : "inactive"} dot>
                          {b.isActive ? "Activa" : "Oculta"}
                        </AdminStatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(b)}
                            title="Editar"
                            className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleActive(b)}
                            disabled={pending}
                            title={b.isActive ? "Ocultar" : "Activar"}
                            className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50"
                          >
                            {rowBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : b.isActive ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => remove(b)}
                            disabled={pending || b.productCount > 0}
                            title={
                              b.productCount > 0
                                ? "No se puede eliminar: tiene productos asociados"
                                : "Eliminar"
                            }
                            className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
