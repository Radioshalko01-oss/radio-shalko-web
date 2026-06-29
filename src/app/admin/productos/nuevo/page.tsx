import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductCreateForm } from "@/components/admin/product-create-form";
import { getBranches } from "@/lib/admin/product-queries";
import { getBrands, getCategoriesTree } from "@/lib/catalog/queries";

export default async function NuevoProductoPage() {
  const [brands, categories, branches] = await Promise.all([
    getBrands(),
    getCategoriesTree(),
    getBranches(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Productos
      </Link>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
        Nuevo producto
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Sube imágenes, completa los datos y define el inventario. Publica de
        inmediato o guárdalo como oculto.
      </p>

      <ProductCreateForm brands={brands} categories={categories} branches={branches} />
    </div>
  );
}
