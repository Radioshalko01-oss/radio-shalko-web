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
import { ProductClassificationFields, type ProductClassificationValue } from "@/components/admin/product-classification-fields";
import { AdminButton } from "@/components/admin/admin-button";
import {
  AdminFieldGroup,
  AdminFormFeedback,
  AdminSectionCard,
  AdminToggle,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin/admin-patterns";

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
  const [classification, setClassification] = useState<ProductClassificationValue>({
    brandId: product?.brand?.id ?? "",
    categoryId: product?.category?.id ?? "",
    subcategoryId: product?.subcategory?.id ?? "",
    catalogVariant: product?.catalogVariant ?? null,
  });
  const [subtitle, setSubtitle] = useState(product?.subtitle ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [specifications, setSpecifications] = useState(product?.specifications ?? "");
  const [features, setFeatures] = useState(product?.features ?? "");
  const [includes, setIncludes] = useState(product?.includes ?? "");
  const [isNew, setIsNew] = useState(product?.isNew ?? false);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isPublished, setIsPublished] = useState(product?.isPublished ?? false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saveBaseline, setSaveBaseline] = useState<string | null>(null);

  function buildInput(): ProductInput {
    return {
      title: title.trim(),
      slug: slug.trim() || undefined,
      sku: sku.trim() || null,
      price: price.trim() as unknown as number,
      brandId: classification.brandId,
      categoryId: classification.categoryId,
      subcategoryId: classification.subcategoryId,
      catalogVariant: classification.catalogVariant,
      subtitle: subtitle.trim() || null,
      description: description.trim() || null,
      specifications: specifications.trim() || null,
      features: features.trim() || null,
      includes: includes.trim() || null,
      isNew,
      isFeatured,
      isPublished,
    };
  }

  const currentSnapshot = useMemo(
    () => JSON.stringify(buildInput()),
    [
      title,
      slug,
      sku,
      price,
      classification,
      subtitle,
      description,
      specifications,
      features,
      includes,
      isNew,
      isFeatured,
      isPublished,
    ],
  );

  const isSyncedWithBaseline =
    saveBaseline !== null && currentSnapshot === saveBaseline;

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
        setSuccess("Cambios guardados correctamente.");
        setSaveBaseline(JSON.stringify(input));
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
        <p className="text-xs text-muted-foreground">
          Misma taxonomía del menú de productos del sitio: familia, tipo, variante y marca.
        </p>
        <div className="mt-4">
          <ProductClassificationFields
            brands={brands}
            categories={categories}
            value={classification}
            onChange={setClassification}
            initialFromProduct={
              product
                ? {
                    categoryName: product.category?.name,
                    subcategoryName: product.subcategory?.name,
                    catalogVariant: product.catalogVariant,
                  }
                : undefined
            }
            errors={{
              brandId: errors.brandId,
              categoryId: errors.categoryId,
              subcategoryId: errors.subcategoryId,
              catalogVariant: errors.catalogVariant,
            }}
          />
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Detalle del producto">
        <div className="space-y-4">
          <AdminFieldGroup label="Descripción" error={errors.description}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe el producto, su propósito y beneficios principales."
              className={adminTextareaClass(Boolean(errors.description))}
            />
          </AdminFieldGroup>
          <AdminFieldGroup label="Especificaciones" error={errors.specifications}>
            <textarea
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
              rows={4}
              placeholder={"Una línea por dato. Ejemplo:\nTeclado: 61 teclas\nPolifonía: 48 voces"}
              className={adminTextareaClass(Boolean(errors.specifications))}
            />
          </AdminFieldGroup>
          <AdminFieldGroup label="Características" error={errors.features}>
            <textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              rows={4}
              placeholder={"Una línea por característica. Ejemplo:\nDiseño ligero con empuñadura\nFuncionamiento intuitivo"}
              className={adminTextareaClass(Boolean(errors.features))}
            />
          </AdminFieldGroup>
          <AdminFieldGroup label="Incluye" error={errors.includes}>
            <textarea
              value={includes}
              onChange={(e) => setIncludes(e.target.value)}
              rows={4}
              placeholder={"Una línea por ítem incluido. Ejemplo:\nTeclado\nAdaptador de corriente\nManual de usuario"}
              className={adminTextareaClass(Boolean(errors.includes))}
            />
          </AdminFieldGroup>
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Estado">
        <div className="space-y-3">
          <AdminToggle
            label="Marcar como novedad"
            description="Muestra la etiqueta “Nuevo” en el catálogo. Solo se muestran 4 novedades; al agregar una nueva, la más antigua sale de la cola."
            checked={isNew}
            onChange={setIsNew}
          />
          <AdminToggle
            label="Marcar como destacado"
            description="Aparece en la pestaña “Destacados” del inicio."
            checked={isFeatured}
            onChange={setIsFeatured}
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
        {isSyncedWithBaseline && (
          <p className="text-sm font-medium text-emerald-600 sm:mr-auto" role="status">
            Cambios guardados
          </p>
        )}
        <AdminButton asChild variant="secondary">
          <Link href="/admin/productos">Cancelar</Link>
        </AdminButton>
        <AdminButton
          type="submit"
          disabled={pending || (mode === "edit" && isSyncedWithBaseline)}
          variant="primary"
          className={
            mode === "edit" && isSyncedWithBaseline
              ? "bg-emerald-600 hover:bg-emerald-600 disabled:opacity-100"
              : undefined
          }
        >
          {pending
            ? "Guardando…"
            : mode === "edit" && isSyncedWithBaseline
              ? "Guardado ✓"
              : mode === "create"
                ? "Crear producto"
                : "Guardar cambios"}
        </AdminButton>
      </div>
    </form>
  );
}
