"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CATALOG_FAMILIES,
  classificationFromStoredProduct,
  getCatalogTypeOptions,
  resolveClassificationSelection,
  type CatalogFamily,
} from "@/lib/navigation/catalog-taxonomy";
import type { CatalogBrand, CatalogCategoryTree } from "@/lib/catalog/types";
import { adminSelectClass } from "@/components/admin/admin-patterns";
import { cn } from "@/lib/utils";

export type ProductClassificationValue = {
  brandId: string;
  categoryId: string;
  subcategoryId: string;
  catalogVariant: string | null;
};

type FieldErrors = {
  brandId?: string[];
  categoryId?: string[];
  subcategoryId?: string[];
  catalogVariant?: string[];
};

type Props = {
  brands: CatalogBrand[];
  categories: CatalogCategoryTree[];
  value: ProductClassificationValue;
  onChange: (value: ProductClassificationValue) => void;
  errors?: FieldErrors;
  /** Valores iniciales al editar (desde producto guardado). */
  initialFromProduct?: {
    categoryName?: string | null;
    subcategoryName?: string | null;
    catalogVariant?: string | null;
  };
};

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error?.[0] && <p className="mt-1 text-xs text-destructive">{error[0]}</p>}
    </div>
  );
}

function selectCls(hasError: boolean) {
  return adminSelectClass(hasError);
}

export function ProductClassificationFields({
  brands,
  categories,
  value,
  onChange,
  errors,
  initialFromProduct,
}: Props) {
  const stored = useMemo(
    () => (initialFromProduct ? classificationFromStoredProduct(initialFromProduct) : null),
    [initialFromProduct],
  );

  const [familyKey, setFamilyKey] = useState<CatalogFamily["key"] | "">(
    stored?.familyKey ?? "",
  );
  const [typeLabel, setTypeLabel] = useState(stored?.typeLabel ?? "");
  const [variantLabel, setVariantLabel] = useState(stored?.variantLabel ?? "");

  useEffect(() => {
    if (!stored) return;
    setFamilyKey(stored.familyKey);
    setTypeLabel(stored.typeLabel);
    setVariantLabel(stored.variantLabel ?? "");
  }, [stored?.familyKey, stored?.typeLabel, stored?.variantLabel]);

  const typeOptions = useMemo(
    () => (familyKey ? getCatalogTypeOptions(familyKey) : []),
    [familyKey],
  );

  const selectedType = useMemo(
    () => typeOptions.find((t) => t.label === typeLabel),
    [typeOptions, typeLabel],
  );

  const variants = selectedType?.variants ?? [];

  function applySelection(
    nextFamily: CatalogFamily["key"] | "",
    nextType: string,
    nextVariant: string,
  ) {
    if (!nextFamily || !nextType) {
      onChange({
        ...value,
        categoryId: "",
        subcategoryId: "",
        catalogVariant: null,
      });
      return;
    }

    const resolved = resolveClassificationSelection(categories, {
      familyKey: nextFamily,
      typeLabel: nextType,
      variantLabel: nextVariant || undefined,
    });

    if (!resolved) {
      onChange({
        ...value,
        categoryId: "",
        subcategoryId: "",
        catalogVariant: nextVariant ? null : null,
      });
      return;
    }

    onChange({
      ...value,
      categoryId: resolved.categoryId,
      subcategoryId: resolved.subcategoryId,
      catalogVariant: resolved.catalogVariant,
    });
  }

  function handleFamilyChange(next: string) {
    const key = next as CatalogFamily["key"] | "";
    setFamilyKey(key);
    setTypeLabel("");
    setVariantLabel("");
    applySelection(key, "", "");
  }

  function handleTypeChange(next: string) {
    setTypeLabel(next);
    setVariantLabel("");
    applySelection(familyKey, next, "");
  }

  function handleVariantChange(next: string) {
    setVariantLabel(next);
    applySelection(familyKey, typeLabel, next);
  }

  const taxonomyError =
    errors?.categoryId?.[0] ?? errors?.subcategoryId?.[0] ?? null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Familia" required error={errors?.categoryId}>
          <select
            value={familyKey}
            onChange={(e) => handleFamilyChange(e.target.value)}
            className={selectCls(Boolean(errors?.categoryId))}
          >
            <option value="">Selecciona…</option>
            {CATALOG_FAMILIES.map((f) => (
              <option key={f.key} value={f.key}>
                {f.title}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tipo de producto" required error={errors?.subcategoryId}>
          <select
            value={typeLabel}
            onChange={(e) => handleTypeChange(e.target.value)}
            disabled={!familyKey}
            className={cn(
              selectCls(Boolean(errors?.subcategoryId)),
              "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-muted-foreground",
            )}
          >
            <option value="">
              {!familyKey ? "Elige una familia" : "Selecciona…"}
            </option>
            {typeOptions.map((t) => (
              <option key={t.label} value={t.label}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Variante" error={errors?.catalogVariant}>
          <select
            value={variantLabel}
            onChange={(e) => handleVariantChange(e.target.value)}
            disabled={!typeLabel || variants.length === 0}
            className={cn(
              selectCls(Boolean(errors?.catalogVariant)),
              "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-muted-foreground",
            )}
          >
            <option value="">
              {!typeLabel
                ? "Elige un tipo"
                : variants.length === 0
                  ? "Sin variantes"
                  : "Opcional…"}
            </option>
            {variants.map((v) => (
              <option key={v.slug} value={v.label}>
                {v.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {taxonomyError && !errors?.categoryId?.[0] && !errors?.subcategoryId?.[0] && (
        <p className="text-xs text-destructive">{taxonomyError}</p>
      )}

      <Field label="Marca" required error={errors?.brandId}>
        <select
          value={value.brandId}
          onChange={(e) => onChange({ ...value, brandId: e.target.value })}
          className={selectCls(Boolean(errors?.brandId))}
        >
          <option value="">Selecciona…</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
