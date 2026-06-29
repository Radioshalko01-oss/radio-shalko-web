/**
 * Capa de datos admin · PRO-3 (cotizaciones).
 * Lectura con requireAdmin(); RLS quotes_select_admin + quote_items con is_admin.
 */
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isQuoteStatus, type QuoteStatus } from "./quote-constants";

export type AdminQuoteListItem = {
  id: string;
  status: QuoteStatus;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  note: string | null;
  itemCount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminQuoteLineItem = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  sku: string | null;
  brandName: string | null;
  image: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type AdminQuoteDetail = AdminQuoteListItem & {
  items: AdminQuoteLineItem[];
};

export type AdminQuoteListFilters = {
  q?: string;
  status?: QuoteStatus;
  /** YYYY-MM-DD inclusive */
  from?: string;
  /** YYYY-MM-DD inclusive */
  to?: string;
  sort?: "recent" | "oldest" | "total_desc" | "total_asc";
  page?: number;
  perPage?: number;
};

export type AdminQuoteListResult = {
  items: AdminQuoteListItem[];
  total: number;
  page: number;
  perPage: number;
};

const ITEM_SELECT = `
  id,
  quantity,
  unit_price,
  product_id,
  products (
    id,
    title,
    slug,
    sku,
    price,
    brand:brands ( name ),
    images:product_images ( url, sort_order )
  )
`;

type RawQuote = {
  id: string;
  user_id: string;
  status: string;
  note: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  created_at: string;
  updated_at: string;
  quote_items: RawQuoteItem[] | null;
};

type RawQuoteItem = {
  id: string;
  quantity: number;
  unit_price: number | null;
  product_id: string;
  products: {
    id: string;
    title: string;
    slug: string;
    sku: string | null;
    price: number;
    brand: { name: string } | null;
    images: Array<{ url: string; sort_order: number }> | null;
  } | null;
};

function pickImage(
  images: Array<{ url: string; sort_order: number }> | null | undefined,
): string | null {
  if (!images?.length) return null;
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  return sorted[0]?.url ?? null;
}

function mapLineItem(row: RawQuoteItem): AdminQuoteLineItem | null {
  const p = row.products;
  if (!p) return null;
  const quantity = Math.max(1, row.quantity);
  const unitPrice = row.unit_price ?? p.price ?? 0;
  return {
    id: row.id,
    productId: row.product_id,
    name: p.title,
    slug: p.slug,
    sku: p.sku,
    brandName: p.brand?.name ?? null,
    image: pickImage(p.images),
    quantity,
    unitPrice,
    subtotal: unitPrice * quantity,
  };
}

function computeTotal(items: RawQuoteItem[] | null | undefined): { count: number; total: number } {
  let count = 0;
  let total = 0;
  for (const row of items ?? []) {
    const line = mapLineItem(row);
    if (!line) continue;
    count += 1;
    total += line.subtotal;
  }
  return { count, total };
}

function mapListItem(
  row: RawQuote,
  profile: { email: string | null; full_name: string | null } | undefined,
): AdminQuoteListItem {
  const { count, total } = computeTotal(row.quote_items);
  const status = isQuoteStatus(row.status) ? row.status : "draft";
  return {
    id: row.id,
    status,
    userId: row.user_id,
    userEmail: profile?.email ?? null,
    userName: profile?.full_name ?? null,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    note: row.note,
    itemCount: count,
    total,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseDayStart(isoDate: string): number | null {
  const t = Date.parse(`${isoDate}T00:00:00`);
  return Number.isNaN(t) ? null : t;
}

function parseDayEnd(isoDate: string): number | null {
  const t = Date.parse(`${isoDate}T23:59:59.999`);
  return Number.isNaN(t) ? null : t;
}

export async function listAdminQuotes(
  filters: AdminQuoteListFilters = {},
): Promise<AdminQuoteListResult> {
  await requireAdmin();
  const supabase = await createClient();

  const perPage = filters.perPage === 50 ? 50 : filters.perPage === 100 ? 100 : 25;
  const page = Math.max(1, filters.page ?? 1);

  const { data, error } = await supabase
    .from("quotes")
    .select(
      `
      id,
      user_id,
      status,
      note,
      contact_name,
      contact_phone,
      contact_email,
      created_at,
      updated_at,
      quote_items ( ${ITEM_SELECT} )
    `,
    )
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return { items: [], total: 0, page, perPage };
  }

  const rows = data as unknown as RawQuote[];
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, { email: p.email, full_name: p.full_name }]),
  );

  let items = rows.map((r) => mapListItem(r, profileMap.get(r.user_id)));

  const term = filters.q?.trim().toLowerCase();
  if (term) {
    items = items.filter((it) => {
      const hay = [
        it.contactEmail,
        it.contactName,
        it.userEmail,
        it.userName,
        it.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }

  if (filters.status) {
    items = items.filter((it) => it.status === filters.status);
  }

  if (filters.from) {
    const from = parseDayStart(filters.from);
    if (from !== null) {
      items = items.filter((it) => Date.parse(it.createdAt) >= from);
    }
  }
  if (filters.to) {
    const to = parseDayEnd(filters.to);
    if (to !== null) {
      items = items.filter((it) => Date.parse(it.createdAt) <= to);
    }
  }

  const sort = filters.sort ?? "recent";
  if (sort === "recent") {
    items.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  } else if (sort === "oldest") {
    items.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  } else if (sort === "total_desc") {
    items.sort((a, b) => b.total - a.total || Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  } else if (sort === "total_asc") {
    items.sort((a, b) => a.total - b.total || Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }

  const total = items.length;
  const fromIdx = (page - 1) * perPage;
  return {
    items: items.slice(fromIdx, fromIdx + perPage),
    total,
    page,
    perPage,
  };
}

export async function getAdminQuote(id: string): Promise<AdminQuoteDetail | null> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quotes")
    .select(
      `
      id,
      user_id,
      status,
      note,
      contact_name,
      contact_phone,
      contact_email,
      created_at,
      updated_at,
      quote_items ( ${ITEM_SELECT} )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as RawQuote;
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", row.user_id)
    .maybeSingle();

  const base = mapListItem(row, profile ?? undefined);
  const items = (row.quote_items ?? [])
    .map(mapLineItem)
    .filter((x): x is AdminQuoteLineItem => x !== null);

  return { ...base, items };
}
