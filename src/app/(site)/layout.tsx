import { Footer } from "@/components/site/footer";
import { HashScroll } from "@/components/site/hash-scroll";
import { BodyScrollGuard } from "@/components/site/body-scroll-guard";
import { SiteHeader, type HeaderProduct } from "@/components/site/header";
import { FavoritesProvider } from "@/components/providers/favorites-provider";
import { QuoteProvider } from "@/components/providers/quote-provider";
import { CompareProvider } from "@/components/providers/compare-provider";
import { CompareUi } from "@/components/catalog/compare-ui";
import { StableMotionProvider } from "@/components/providers/stable-motion-provider";
import { getHeaderCatalogProducts, getActiveTaxonomyNames, getBrands } from "@/lib/catalog/queries";
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

  const [headerCatalog, favoriteIds, quoteItems, activeBrands, activeTaxonomy, orderSummary, adminOrderAttention, notificationSummary] =
    await Promise.all([
      getHeaderCatalogProducts(),
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
  const headerProducts = headerCatalog;

  // Taxonomía real (categoría → subcategorías) para el mega menú. Orden estable
  // y solo categorías/subcategorías que existen en el catálogo (rutas válidas).
  const CATEGORY_ORDER = ["Instrumentos", "Accesorios", "Equipos de Audio"];
  const taxonomyMap: Record<string, string[]> = {};
  for (const p of headerCatalog) {
    const cat = p.category;
    if (!cat || !activeCatSet.has(cat)) continue;
    if (!taxonomyMap[cat]) taxonomyMap[cat] = [];
    const sub = p.subcategory;
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
          <StableMotionProvider>
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
            <BodyScrollGuard />
            <main>{children}</main>
            <Footer />
            <CompareUi />
          </div>
          </StableMotionProvider>
        </CompareProvider>
      </QuoteProvider>
    </FavoritesProvider>
  );
}
