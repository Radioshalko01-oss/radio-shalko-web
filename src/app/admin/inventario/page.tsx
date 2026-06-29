import { listInventory, type InventoryStockFilter } from "@/lib/admin/inventory-queries";
import { getBranches } from "@/lib/admin/product-queries";
import { getBrands, getCategoriesTree } from "@/lib/catalog/queries";
import { InventoryManager } from "@/components/admin/inventory-manager";

type SearchParams = Promise<{
  q?: string;
  cat?: string;
  sub?: string;
  brand?: string;
  estado?: string;
  stock?: string;
  branch?: string;
  sort?: string;
  per?: string;
  page?: string;
}>;

export default async function AdminInventarioPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const published =
    sp.estado === "publicados" ? true : sp.estado === "ocultos" ? false : undefined;
  const stock: InventoryStockFilter | undefined =
    sp.stock === "con" ? "in" : sp.stock === "sin" ? "out" : sp.stock === "bajo" ? "low" : undefined;
  const perPage = sp.per === "50" ? 50 : sp.per === "100" ? 100 : 25;
  const page = Math.max(1, Number(sp.page) || 1);

  const [result, brands, categories, branches] = await Promise.all([
    listInventory({
      q: sp.q,
      categoryId: sp.cat,
      subcategoryId: sp.sub,
      brandId: sp.brand,
      published,
      stock,
      branchId: sp.branch,
      sort: sp.sort,
      page,
      perPage,
    }),
    getBrands(),
    getCategoriesTree(),
    getBranches(),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Inventario</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {result.total} producto{result.total === 1 ? "" : "s"} · stock por sucursal
        </p>
      </div>

      <InventoryManager
        result={result}
        brands={brands}
        categories={categories}
        branches={branches}
        filters={{
          q: sp.q ?? "",
          cat: sp.cat ?? "",
          sub: sp.sub ?? "",
          brand: sp.brand ?? "",
          estado: sp.estado ?? "",
          stock: sp.stock ?? "",
          branch: sp.branch ?? "",
          sort: sp.sort ?? "name",
          per: String(perPage),
        }}
      />
    </div>
  );
}
