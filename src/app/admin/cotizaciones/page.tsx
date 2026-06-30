import {
  getAdminQuote,
  listAdminQuotes,
  type AdminQuoteListFilters,
} from "@/lib/admin/quote-queries";
import { isQuoteStatus } from "@/lib/admin/quote-constants";
import { QuotesManager } from "@/components/admin/quotes-manager";
import { PageHeader } from "@/components/ui/page-header";

type SearchParams = Promise<{
  q?: string;
  estado?: string;
  from?: string;
  to?: string;
  sort?: string;
  per?: string;
  page?: string;
  id?: string;
}>;

export default async function AdminCotizacionesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const status = sp.estado && isQuoteStatus(sp.estado) ? sp.estado : undefined;
  const perPage = sp.per === "50" ? 50 : sp.per === "100" ? 100 : 25;
  const page = Math.max(1, Number(sp.page) || 1);

  const sort: AdminQuoteListFilters["sort"] =
    sp.sort === "oldest" ||
    sp.sort === "total_desc" ||
    sp.sort === "total_asc"
      ? sp.sort
      : "recent";

  const listFilters: AdminQuoteListFilters = {
    q: sp.q,
    status,
    from: sp.from,
    to: sp.to,
    sort,
    page,
    perPage,
  };

  const [result, detail] = await Promise.all([
    listAdminQuotes(listFilters),
    sp.id ? getAdminQuote(sp.id) : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        variant="admin"
        className="mb-6"
        title="Solicitudes / Carritos"
        description={`${result.total} solicitud${result.total === 1 ? "" : "es"} · carritos de usuarios`}
      />

      <QuotesManager
        result={result}
        detail={detail}
        filters={{
          q: sp.q ?? "",
          estado: sp.estado ?? "",
          from: sp.from ?? "",
          to: sp.to ?? "",
          sort: sp.sort ?? "recent",
          per: String(perPage),
          id: sp.id ?? "",
        }}
      />
    </div>
  );
}
