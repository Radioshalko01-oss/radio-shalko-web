import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { ProductGalleryField } from "@/components/admin/product-gallery-field";
import { ProductInventoryField } from "@/components/admin/product-inventory-field";
import { ProductDeleteButton } from "@/components/admin/product-delete-button";
import { getAdminProductById, getBranches } from "@/lib/admin/product-queries";
import { getBrands, getCategoriesTree } from "@/lib/catalog/queries";

type Params = Promise<{ id: string }>;

export default async function EditarProductoPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const [product, brands, categories, branches] = await Promise.all([
    getAdminProductById(id),
    getBrands(),
    getCategoriesTree(),
    getBranches(),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Productos
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Editar producto
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{product.name}</p>
        </div>
        {product.isPublished && (
          <Link
            href={`/productos/${product.slug}`}
            target="_blank"
            className="shrink-0 text-sm text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline"
          >
            Ver en el sitio ↗
          </Link>
        )}
      </div>

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

      <div className="mt-10 flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50/40 p-5">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Zona de peligro</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
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
