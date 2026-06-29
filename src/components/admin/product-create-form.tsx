"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { ImageIcon, Loader2, Plus, Star, Trash2, Upload } from "lucide-react";
import { createProduct, updateProductInventory, type ProductInput } from "@/lib/admin/product-actions";
import { addProductImage } from "@/lib/admin/product-gallery-actions";
import {
  MAX_GALLERY_IMAGES,
  uploadProductGalleryImage,
  validateMainImage,
} from "@/lib/admin/product-image-upload";
import type {
  CatalogBranch,
  CatalogBrand,
  CatalogCategoryTree,
} from "@/lib/catalog/types";

type FieldErrors = Record<string, string[]>;
type PendingImage = { id: string; file: File; previewUrl: string };

const inputBase =
  "h-9 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2";
const inputOk = "border-zinc-200 focus:border-zinc-400 focus:ring-zinc-100";
const inputErr = "border-red-300 focus:border-red-400 focus:ring-red-100";

function inputCls(hasError: boolean) {
  return `${inputBase} ${hasError ? inputErr : inputOk}`;
}

function localId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ProductCreateForm({
  brands,
  categories,
  branches,
}: {
  brands: CatalogBrand[];
  categories: CatalogCategoryTree[];
  branches: CatalogBranch[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Campos
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Galería (pendiente, client-side hasta guardar)
  const [images, setImages] = useState<PendingImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inventario
  const [quantities, setQuantities] = useState<Record<string, string>>(() =>
    Object.fromEntries(branches.map((b) => [b.id, "0"])),
  );

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const subcategories = useMemo(() => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.subcategories ?? [];
  }, [categories, categoryId]);

  function handleCategoryChange(next: string) {
    setCategoryId(next);
    const cat = categories.find((c) => c.id === next);
    const stillValid = cat?.subcategories.some((s) => s.id === subcategoryId);
    if (!stillValid) setSubcategoryId("");
  }

  // --- Galería ---
  function addFiles(files: FileList | File[]) {
    setFormError(null);
    const list = Array.from(files);
    setImages((prev) => {
      const room = MAX_GALLERY_IMAGES - prev.length;
      if (room <= 0) {
        setFormError(`Máximo ${MAX_GALLERY_IMAGES} imágenes por producto.`);
        return prev;
      }
      const accepted: PendingImage[] = [];
      for (const file of list.slice(0, room)) {
        const err = validateMainImage(file);
        if (err) {
          setFormError(err);
          continue;
        }
        accepted.push({ id: localId(), file, previewUrl: URL.createObjectURL(file) });
      }
      return [...prev, ...accepted];
    });
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  function makeMain(id: string) {
    setImages((prev) => {
      const target = prev.find((p) => p.id === id);
      if (!target) return prev;
      return [target, ...prev.filter((p) => p.id !== id)];
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  // --- Inventario ---
  function setQty(branchId: string, value: string) {
    setQuantities((prev) => ({ ...prev, [branchId]: value }));
  }

  function buildInput(): ProductInput {
    return {
      title: title.trim(),
      slug: slug.trim() || undefined,
      sku: sku.trim() || null,
      price: price.trim() as unknown as number,
      brandId,
      categoryId,
      subcategoryId: subcategoryId || null,
      subtitle: subtitle.trim() || null,
      description: description.trim() || null,
      isNew,
      isPublished,
    };
  }

  function buildInventoryItems() {
    const items: Array<{ branchId: string; quantity: number }> = [];
    for (const b of branches) {
      const raw = (quantities[b.id] ?? "").trim();
      const n = raw === "" ? 0 : Number(raw);
      if (Number.isInteger(n) && n >= 0) items.push({ branchId: b.id, quantity: n });
    }
    return items;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    setProgress(null);

    startTransition(async () => {
      // 1) Crear producto
      const res = await createProduct(buildInput());
      if (!res.ok) {
        setFormError(res.error);
        if (res.fieldErrors) setErrors(res.fieldErrors);
        return;
      }
      const productId = res.data.id;

      // 2) Subir imágenes en orden (la primera será la principal)
      let uploadFailures = 0;
      for (let i = 0; i < images.length; i++) {
        setProgress(`Subiendo imagen ${i + 1} de ${images.length}…`);
        const up = await uploadProductGalleryImage(productId, images[i].file);
        if (!up.ok) {
          uploadFailures++;
          continue;
        }
        const saved = await addProductImage(productId, { url: up.url, alt: title.trim() });
        if (!saved.ok) uploadFailures++;
      }

      // 3) Inventario
      const items = buildInventoryItems();
      if (items.length) {
        setProgress("Guardando inventario…");
        await updateProductInventory(productId, items);
      }

      // Limpiar previews
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));

      // 4) Continuar en edición (para ajustes finos)
      router.push(`/admin/productos/${productId}/editar`);
      router.refresh();
      if (uploadFailures > 0) {
        // El producto existe; informamos sin bloquear la navegación.
        console.warn(`[crear producto] ${uploadFailures} imágenes no se subieron.`);
      }
    });
  }

  const atLimit = images.length >= MAX_GALLERY_IMAGES;
  const submitLabel = pending
    ? progress ?? "Guardando…"
    : isPublished
      ? "Publicar producto"
      : "Guardar producto";

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-8">
      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      {/* Galería del producto */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Galería del producto</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Hasta {MAX_GALLERY_IMAGES} imágenes. La primera es la principal. Arrastra para
              reordenar. JPG, PNG o WEBP, máx. 5 MB.
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-zinc-400">
            {images.length}/{MAX_GALLERY_IMAGES}
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />

        {images.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-12 text-center transition-colors ${
              dragOver ? "border-zinc-400 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
            }`}
          >
            <Upload className="h-8 w-8 text-zinc-300" />
            <span className="text-sm font-medium text-zinc-700">
              Arrastra imágenes o haz clic para subir
            </span>
            <span className="text-xs text-zinc-400">Hasta {MAX_GALLERY_IMAGES} imágenes</span>
          </button>
        ) : (
          <div
            className={`mt-4 rounded-xl ${dragOver ? "ring-2 ring-zinc-300" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((img, index) => (
                <div
                  key={img.id}
                  draggable
                  onDragStart={() => (dragIndex.current = index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragIndex.current !== null) reorder(dragIndex.current, index);
                    dragIndex.current = null;
                    setDragOver(false);
                  }}
                  className="group relative cursor-grab overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 active:cursor-grabbing"
                >
                  <div className="relative aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                    {index === 0 && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-zinc-900/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                        <Star className="h-3 w-3 fill-current" />
                        Principal
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-0.5 border-t border-zinc-200 bg-white px-2 py-1.5">
                    {index !== 0 && (
                      <button
                        type="button"
                        aria-label="Marcar como principal"
                        title="Marcar como principal"
                        onClick={() => makeMain(img.id)}
                        className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Eliminar"
                      title="Eliminar"
                      onClick={() => removeImage(img.id)}
                      className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {!atLimit && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-200 text-zinc-400 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-600"
                >
                  <Plus className="h-6 w-6" />
                  <span className="text-xs font-medium">Agregar</span>
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Datos básicos */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-900">Datos básicos</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Título" required error={errors.title} className="sm:col-span-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Guitarra eléctrica Stratocaster"
              className={inputCls(Boolean(errors.title))}
            />
          </Field>
          <Field label="Slug" error={errors.slug} hint="Se genera automáticamente si lo dejas vacío.">
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="guitarra-electrica-stratocaster"
              className={inputCls(Boolean(errors.slug))}
            />
          </Field>
          <Field label="SKU" error={errors.sku}>
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Opcional"
              className={inputCls(Boolean(errors.sku))}
            />
          </Field>
          <Field label="Precio (MXN)" required error={errors.price}>
            <input
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className={inputCls(Boolean(errors.price))}
            />
          </Field>
          <Field label="Subtítulo" error={errors.subtitle}>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Opcional"
              className={inputCls(Boolean(errors.subtitle))}
            />
          </Field>
        </div>
      </section>

      {/* Clasificación */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-900">Clasificación</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Marca" required error={errors.brandId}>
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={inputCls(Boolean(errors.brandId))}>
              <option value="">Selecciona…</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Categoría" required error={errors.categoryId}>
            <select value={categoryId} onChange={(e) => handleCategoryChange(e.target.value)} className={inputCls(Boolean(errors.categoryId))}>
              <option value="">Selecciona…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Subcategoría" error={errors.subcategoryId}>
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              disabled={!categoryId || subcategories.length === 0}
              className={`${inputCls(Boolean(errors.subcategoryId))} disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400`}
            >
              <option value="">
                {!categoryId ? "Elige una categoría" : subcategories.length === 0 ? "Sin subcategorías" : "Sin subcategoría"}
              </option>
              {subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* Descripción */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-900">Descripción</h2>
        <div className="mt-4">
          <Field label="Descripción" error={errors.description}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe el producto, sus características y diferenciadores."
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 ${
                errors.description ? inputErr : inputOk
              }`}
            />
          </Field>
        </div>
      </section>

      {/* Inventario */}
      {branches.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-zinc-900">Inventario por sucursal</h2>
          <p className="mt-1 text-xs text-zinc-500">Existencias iniciales. Entero mayor o igual a cero.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {branches.map((b) => (
              <div key={b.id}>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  {b.displayName || b.name}
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={quantities[b.id] ?? "0"}
                  onChange={(e) => setQty(b.id, e.target.value)}
                  className={inputCls(false)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Estado */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-900">Estado</h2>
        <div className="mt-4 space-y-3">
          <Toggle
            label="Marcar como novedad"
            description="Muestra la etiqueta “Nuevo” en el catálogo."
            checked={isNew}
            onChange={setIsNew}
          />
          <Toggle
            label="Publicado"
            description="Si está activo, el producto aparece de inmediato en la tienda."
            checked={isPublished}
            onChange={setIsPublished}
          />
        </div>
      </section>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3">
        <Link
          href="/admin/productos"
          className="inline-flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string[];
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error?.[0] ? (
        <p className="mt-1 text-xs text-red-600">{error[0]}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-zinc-400">{hint}</p>
      ) : null}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-200"
      />
      <span>
        <span className="block text-sm font-medium text-zinc-900">{label}</span>
        <span className="block text-xs text-zinc-500">{description}</span>
      </span>
    </label>
  );
}
