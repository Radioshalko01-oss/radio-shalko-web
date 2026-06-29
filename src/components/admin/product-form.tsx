"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createProduct, updateProduct, type ProductInput } from "@/lib/admin/product-actions";
import type {
  CatalogBrand,
  CatalogCategoryTree,
  CatalogProduct,
} from "@/lib/catalog/types";

type FieldErrors = Record<string, string[]>;

type ProductFormProps = {
  mode: "create" | "edit";
  brands: CatalogBrand[];
  categories: CatalogCategoryTree[];
  /** Solo en modo edición. */
  productId?: string;
  product?: CatalogProduct | null;
};

const inputBase =
  "h-9 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2";
const inputOk =
  "border-zinc-200 focus:border-zinc-400 focus:ring-zinc-100";
const inputErr =
  "border-red-300 focus:border-red-400 focus:ring-red-100";

function inputCls(hasError: boolean) {
  return `${inputBase} ${hasError ? inputErr : inputOk}`;
}

export function ProductForm({
  mode,
  brands,
  categories,
  productId,
  product,
}: ProductFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [price, setPrice] = useState(
    product?.price != null ? String(product.price) : "",
  );
  const [brandId, setBrandId] = useState(product?.brand?.id ?? "");
  const [categoryId, setCategoryId] = useState(product?.category?.id ?? "");
  const [subcategoryId, setSubcategoryId] = useState(
    product?.subcategory?.id ?? "",
  );
  const [subtitle, setSubtitle] = useState(product?.subtitle ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [isNew, setIsNew] = useState(product?.isNew ?? false);
  const [isPublished, setIsPublished] = useState(product?.isPublished ?? false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Subcategorías de la categoría seleccionada (dependiente).
  const subcategories = useMemo(() => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.subcategories ?? [];
  }, [categories, categoryId]);

  function handleCategoryChange(nextCategoryId: string) {
    setCategoryId(nextCategoryId);
    // Si la subcategoría actual no pertenece a la nueva categoría, limpiarla.
    const cat = categories.find((c) => c.id === nextCategoryId);
    const stillValid = cat?.subcategories.some((s) => s.id === subcategoryId);
    if (!stillValid) setSubcategoryId("");
  }

  function buildInput(): ProductInput {
    return {
      title: title.trim(),
      slug: slug.trim() || undefined,
      sku: sku.trim() || null,
      // z.coerce.number convierte el string; "" se valida como inválido.
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    setSuccess(null);

    const input = buildInput();

    startTransition(async () => {
      const res =
        mode === "create"
          ? await createProduct(input)
          : await updateProduct(productId as string, input);

      if (!res.ok) {
        setFormError(res.error);
        if (res.fieldErrors) setErrors(res.fieldErrors);
        return;
      }

      if (mode === "create") {
        // Continuar en la pantalla de edición del producto recién creado
        // (allí vivirán imagen e inventario en fases posteriores).
        router.push(`/admin/productos/${res.data.id}/editar`);
        router.refresh();
      } else {
        setSuccess("Cambios guardados.");
        setSlug(res.data.slug);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-8">
      {(formError || success) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            formError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {formError ?? success}
        </div>
      )}

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

          <Field
            label="Slug"
            error={errors.slug}
            hint="Se genera automáticamente desde el título si lo dejas vacío."
          >
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
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className={inputCls(Boolean(errors.brandId))}
            >
              <option value="">Selecciona…</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Categoría" required error={errors.categoryId}>
            <select
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={inputCls(Boolean(errors.categoryId))}
            >
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
                {!categoryId
                  ? "Elige una categoría"
                  : subcategories.length === 0
                    ? "Sin subcategorías"
                    : "Sin subcategoría"}
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
            description="Si está activo, el producto es visible en el sitio público."
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
          className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending
            ? "Guardando…"
            : mode === "create"
              ? "Crear producto"
              : "Guardar cambios"}
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
