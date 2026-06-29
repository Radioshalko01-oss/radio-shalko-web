import {
  listAdminCategories,
  listCategorizableProducts,
} from "@/lib/admin/category-queries";
import { CategoriesManager } from "@/components/admin/categories-manager";

export default async function AdminCategoriasPage() {
  const [categories, products] = await Promise.all([
    listAdminCategories(),
    listCategorizableProducts(),
  ]);
  const subCount = categories.reduce((n, c) => n + c.subcategories.length, 0);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Categorías</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {categories.length} categoría{categories.length === 1 ? "" : "s"} · {subCount}{" "}
          subcategoría{subCount === 1 ? "" : "s"} · organiza la taxonomía y asigna productos.
        </p>
      </div>

      <CategoriesManager initial={categories} products={products} />
    </div>
  );
}
