import {
  listAdminCategories,
  listCategorizableProducts,
} from "@/lib/admin/category-queries";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminCategoriasPage() {
  const [categories, products] = await Promise.all([
    listAdminCategories(),
    listCategorizableProducts(),
  ]);
  const subCount = categories.reduce((n, c) => n + c.subcategories.length, 0);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        variant="admin"
        className="mb-6"
        title="Categorías"
        description={`${categories.length} categoría${categories.length === 1 ? "" : "s"} · ${subCount} subcategoría${subCount === 1 ? "" : "s"} · organiza la taxonomía y asigna productos.`}
      />

      <CategoriesManager initial={categories} products={products} />
    </div>
  );
}
