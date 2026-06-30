import { ProductCreateForm } from "@/components/admin/product-create-form";
import { getBranches } from "@/lib/admin/product-queries";
import { getBrands, getCategoriesTree } from "@/lib/catalog/queries";
import { PageHeader } from "@/components/ui/page-header";

export default async function NuevoProductoPage() {
  const [brands, categories, branches] = await Promise.all([
    getBrands(),
    getCategoriesTree(),
    getBranches(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        variant="admin"
        backLink={{ href: "/admin/productos", label: "Productos", icon: "arrow" }}
        title="Nuevo producto"
        description="Sube imágenes, completa los datos y define el inventario. Publica de inmediato o guárdalo como oculto."
      />

      <ProductCreateForm brands={brands} categories={categories} branches={branches} />
    </div>
  );
}
