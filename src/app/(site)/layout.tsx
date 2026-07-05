import { Footer } from "@/components/site/footer";
import { HashScroll } from "@/components/site/hash-scroll";
import { SiteHeader, type HeaderProduct } from "@/components/site/header";
import { FavoritesProvider } from "@/components/providers/favorites-provider";
import { QuoteProvider } from "@/components/providers/quote-provider";
import { CompareProvider } from "@/components/providers/compare-provider";
import { CompareUi } from "@/components/catalog/compare-ui";
import { getCatalogProducts } from "@/lib/catalog";
import { getActiveTaxonomyNames, getBrands } from "@/lib/catalog/queries";
import { getCurrentAccount } from "@/lib/auth/account";
import { getFavoriteIds } from "@/lib/favorites/actions";
import { getQuoteItems } from "@/lib/quotes/actions";
import { getCustomerOrderSummary } from "@/lib/orders/customer-queries";
import { getAdminHeaderOrderAttention } from "@/lib/orders/notification-queries";
import { getCustomerNotificationSummary } from "@/lib/notifications/customer-notification-queries";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const account = await getCurrentAccount();

  const [products, favoriteIds, quoteItems, activeBrands, activeTaxonomy, orderSummary, adminOrderAttention, notificationSummary] =
    await Promise.all([
      getCatalogProducts(),
      getFavoriteIds(),
      getQuoteItems(),
      getBrands({ activeOnly: true }),
      getActiveTaxonomyNames(),
      account && !account.isAdmin ? getCustomerOrderSummary() : Promise.resolve(null),
      account?.isAdmin ? getAdminHeaderOrderAttention() : Promise.resolve(false),
      account ? getCustomerNotificationSummary() : Promise.resolve(null),
    ]);
  const brandNames = activeBrands.map((b) => b.name);
  const activeCatSet = new Set(activeTaxonomy.categoryNames);
  const activeSubSet = new Set(activeTaxonomy.subcategoryNames);
  const headerProducts: HeaderProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand?.name ?? "",
    subcategory: p.subcategory?.name ?? "",
    price: p.price,
    image: p.images[0]?.url ?? "",
  }));

  // Taxonomía real (categoría → subcategorías) para el mega menú. Orden estable
  // y solo categorías/subcategorías que existen en el catálogo (rutas válidas).
  const CATEGORY_ORDER = ["Instrumentos", "Accesorios", "Equipos de Audio"];
  const taxonomyMap: Record<string, string[]> = {};
  for (const p of products) {
    const cat = p.category?.name;
    // Solo categorías/subcategorías activas aparecen en el menú.
    if (!cat || !activeCatSet.has(cat)) continue;
    if (!taxonomyMap[cat]) taxonomyMap[cat] = [];
    const sub = p.subcategory?.name;
    if (sub && activeSubSet.has(sub) && !taxonomyMap[cat].includes(sub)) {
      taxonomyMap[cat].push(sub);
    }
  }
  const taxonomy: Record<string, string[]> = {};
  for (const cat of Object.keys(taxonomyMap).sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  })) {
    taxonomy[cat] = taxonomyMap[cat];
  }

  return (
    <FavoritesProvider isAuthed={account !== null} initialIds={favoriteIds}>
      <QuoteProvider isAuthed={account !== null} initialItems={quoteItems}>
        <CompareProvider>
          <div className="min-h-dvh bg-background text-foreground">
            <SiteHeader
              products={headerProducts}
              account={
                account
                  ? {
                      ...account,
                      hasOrderAttention: account.isAdmin
                        ? adminOrderAttention
                        : (orderSummary?.hasAttention ?? false),
                      unreadNotifications: notificationSummary?.unreadCount ?? 0,
                      cartItemCount: quoteItems.reduce((sum, item) => sum + item.quantity, 0),
                    }
                  : null
              }
              taxonomy={taxonomy}
              brands={brandNames}
            />
            <HashScroll />
            <main>{children}</main>
            <Footer />
            <CompareUi />
          </div>
        </CompareProvider>
      </QuoteProvider>
    </FavoritesProvider>
  );
}
