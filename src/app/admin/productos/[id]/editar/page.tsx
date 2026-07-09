import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { ProductGalleryField } from "@/components/admin/product-gallery-field";
import { ProductInventoryField } from "@/components/admin/product-inventory-field";
import { ProductDeleteButton } from "@/components/admin/product-delete-button";
import { getAdminProductById, getBranches } from "@/lib/admin/product-queries";
import { getBrands, getCategoriesTree } from "@/lib/catalog/queries";
import { PageHeader } from "@/components/ui/page-header";
import { adminShell } from "@/lib/design/admin-shell";
import { cn } from "@/lib/utils";

type Params = Promise<{ id: string }>;

export default async function EditarProductoPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const product = await getAdminProductById(id);
  if (!product) notFound();

  const [brands, categories, branches] = await Promise.all([
    getBrands({
      includeBrandIds: product.brand?.id ? [product.brand.id] : [],
    }),
    getCategoriesTree({
      includeSubcategoryIds: product.subcategory?.id ? [product.subcategory.id] : [],
    }),
    getBranches(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        variant="admin"
        backLink={{ href: "/admin/productos", label: "Productos", icon: "arrow" }}
        title="Editar producto"
        description={product.name}
        actions={
          product.isPublished ? (
            <Link
              href={`/productos/${product.slug}`}
              target="_blank"
              className="shrink-0 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Ver en el sitio ↗
            </Link>
          ) : undefined
        }
      />

      <div className="mt-6">
        <ProductGalleryField
          productId={product.id}
          productName={product.name}
          initialImages={product.images}
        />
      </div>

      <ProductForm
        mode="edit"
        productId={product.id}
        product={product}
        brands={brands}
        categories={categories}
      />

      <div className="mt-8">
        <ProductInventoryField
          productId={product.id}
          branches={branches}
          inventory={product.inventory}
        />
      </div>

      <div className={cn(adminShell.dangerZone, "mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between")}>
        <div>
          <h2 className={adminShell.sectionTitleSm}>Zona de peligro</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Elimina este producto de forma permanente. No se puede deshacer.
          </p>
        </div>
        <ProductDeleteButton
          id={product.id}
          name={product.name}
          variant="button"
          redirectTo="/admin/productos"
        />
      </div>
    </div>
  );
}
