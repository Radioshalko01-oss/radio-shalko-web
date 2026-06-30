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
import { AdminButton } from "@/components/admin/admin-button";
import {
  AdminFieldGroup,
  AdminFormFeedback,
  AdminSectionCard,
  AdminToggle,
  adminInputClass,
  adminSelectClass,
  adminTextareaClass,
} from "@/components/admin/admin-patterns";
import { cn } from "@/lib/utils";

type FieldErrors = Record<string, string[]>;

type ProductFormProps = {
  mode: "create" | "edit";
  brands: CatalogBrand[];
  categories: CatalogCategoryTree[];
  productId?: string;
  product?: CatalogProduct | null;
};

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

  const subcategories = useMemo(() => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.subcategories ?? [];
  }, [categories, categoryId]);

  function handleCategoryChange(nextCategoryId: string) {
    setCategoryId(nextCategoryId);
    const cat = categories.find((c) => c.id === nextCategoryId);
    const stillValid = cat?.subcategories.some((s) => s.id === subcategoryId);
    if (!stillValid) setSubcategoryId("");
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
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <AdminFormFeedback error={formError} success={success} />

      <AdminSectionCard title="Datos básicos">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminFieldGroup label="Título" required error={errors.title} className="sm:col-span-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Guitarra eléctrica Stratocaster"
              className={adminInputClass(Boolean(errors.title))}
            />
          </AdminFieldGroup>

          <AdminFieldGroup
            label="Slug"
            error={errors.slug}
            hint="Se genera automáticamente desde el título si lo dejas vacío."
          >
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="guitarra-electrica-stratocaster"
              className={adminInputClass(Boolean(errors.slug))}
            />
          </AdminFieldGroup>

          <AdminFieldGroup label="SKU" error={errors.sku}>
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Opcional"
              className={adminInputClass(Boolean(errors.sku))}
            />
          </AdminFieldGroup>

          <AdminFieldGroup label="Precio (MXN)" required error={errors.price}>
            <input
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
              className={adminInputClass(Boolean(errors.price))}
            />
          </AdminFieldGroup>

          <AdminFieldGroup label="Subtítulo" error={errors.subtitle}>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Opcional"
              className={adminInputClass(Boolean(errors.subtitle))}
            />
          </AdminFieldGroup>
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Clasificación">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AdminFieldGroup label="Marca" required error={errors.brandId}>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className={adminSelectClass(Boolean(errors.brandId))}
            >
              <option value="">Selecciona…</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </AdminFieldGroup>

          <AdminFieldGroup label="Categoría" required error={errors.categoryId}>
            <select
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={adminSelectClass(Boolean(errors.categoryId))}
            >
              <option value="">Selecciona…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </AdminFieldGroup>

          <AdminFieldGroup label="Subcategoría" error={errors.subcategoryId}>
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              disabled={!categoryId || subcategories.length === 0}
              className={cn(
                adminSelectClass(Boolean(errors.subcategoryId)),
                "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-muted-foreground",
              )}
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
          </AdminFieldGroup>
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Descripción">
        <AdminFieldGroup label="Descripción" error={errors.description}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe el producto, sus características y diferenciadores."
            className={adminTextareaClass(Boolean(errors.description))}
          />
        </AdminFieldGroup>
      </AdminSectionCard>

      <AdminSectionCard title="Estado">
        <div className="space-y-3">
          <AdminToggle
            label="Marcar como novedad"
            description="Muestra la etiqueta “Nuevo” en el catálogo."
            checked={isNew}
            onChange={setIsNew}
          />
          <AdminToggle
            label="Publicado"
            description="Si está activo, el producto es visible en el sitio público."
            checked={isPublished}
            onChange={setIsPublished}
          />
        </div>
      </AdminSectionCard>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
        <AdminButton asChild variant="secondary">
          <Link href="/admin/productos">Cancelar</Link>
        </AdminButton>
        <AdminButton type="submit" disabled={pending} variant="primary">
          {pending
            ? "Guardando…"
            : mode === "create"
              ? "Crear producto"
              : "Guardar cambios"}
        </AdminButton>
      </div>
    </form>
  );
}
