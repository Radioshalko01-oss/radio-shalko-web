import {
  listAdminProductsPaged,
  getBranches,
  type AdminProductSort,
} from "@/lib/admin/product-queries";
import { getBrands, getCategoriesTree } from "@/lib/catalog/queries";
import { ProductsManager } from "@/components/admin/products-manager";

type SearchParams = Promise<{
  q?: string;
  cat?: string;
  sub?: string;
  brand?: string;
  estado?: string;
  inv?: string;
  sort?: string;
  per?: string;
  page?: string;
}>;

const SORTS: AdminProductSort[] = [
  "name_asc",
  "name_desc",
  "price_asc",
  "price_desc",
  "stock_asc",
  "stock_desc",
  "recent",
];

export default async function AdminProductosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const published =
    sp.estado === "publicados" ? true : sp.estado === "ocultos" ? false : undefined;
  const stock = sp.inv === "con" ? "in" : sp.inv === "sin" ? "out" : undefined;
  const sort = (SORTS.includes(sp.sort as AdminProductSort) ? sp.sort : "name_asc") as AdminProductSort;
  const perPage = sp.per === "50" ? 50 : sp.per === "100" ? 100 : 25;
  const page = Math.max(1, Number(sp.page) || 1);

  const [result, brands, categories, branches] = await Promise.all([
    listAdminProductsPaged({
      q: sp.q,
      categoryId: sp.cat,
      subcategoryId: sp.sub,
      brandId: sp.brand,
      published,
      stock,
      sort,
      page,
      perPage,
    }),
    getBrands(),
    getCategoriesTree(),
    getBranches(),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Productos</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {result.total} producto{result.total === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <ProductsManager
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
          inv: sp.inv ?? "",
          sort,
          per: String(perPage),
        }}
      />
    </div>
  );
}
