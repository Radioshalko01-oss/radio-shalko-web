"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingBag, Menu, X, ChevronDown, ArrowUpRight, Clock, Heart, Trash2, User, LogOut, Shield, Lock, MessageCircle, Package, Bell } from "lucide-react";
import { whatsappHref } from "@/lib/site-contact";
import { CartShareActions } from "@/components/cart/cart-share-actions";
import { buildQuoteWhatsAppHref } from "@/lib/whatsapp/product-message";
import { QuantityStepper } from "@/components/catalog/quantity-stepper";
import { typography } from "@/lib/design/tokens";
import { siteShell } from "@/lib/design/site-shell";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState, useLayoutEffect, type ReactNode } from "react";
import { useIsBelowLg } from "@/hooks/use-media-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BRANDS, CATEGORY_TREE, formatPrice } from "@/lib/products";
import { useFavorites } from "@/hooks/use-favorites";
import { useQuote } from "@/hooks/use-quote";
import { signOut } from "@/lib/auth/actions";
import { SiteLogo } from "@/components/brand/site-logo";
import { BRAND_ARIA_LABEL } from "@/lib/brand/assets";
import {
  BrandsMegaMenu,
  ProductsMegaMenu,
} from "@/components/site/mega-menus";
import {
  FEATURED_BRAND_CANDIDATES,
  OFFICIAL_BRANDS,
  type CatalogMenuItem,
} from "@/lib/navigation/catalog-taxonomy";

const PANEL_SHEET_CLOSE =
  "[&>button]:right-5 [&>button]:top-5 [&>button]:grid [&>button]:h-9 [&>button]:w-9 [&>button]:place-items-center [&>button]:rounded-full [&>button]:border [&>button]:border-border/70 [&>button]:bg-background [&>button]:opacity-100 [&>button]:shadow-none [&>button]:transition-colors [&>button]:hover:bg-muted [&>button]:focus:ring-0";

const panelBtnPrimary =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90";

const panelBtnSecondary =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-muted/50";

/** Índice ligero de productos (Supabase) para búsqueda y drawers del header. */
export type HeaderProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  subcategory: string;
  price: number;
  image: string;
};

/** Identidad mínima de la sesión para la UI del header. */
export type HeaderAccount = {
  email: string | null;
  isAdmin: boolean;
  hasOrderAttention?: boolean;
  unreadNotifications?: number;
  cartItemCount?: number;
};

const ACCOUNT_ITEM =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-foreground/85 transition-colors hover:bg-muted/60 hover:text-foreground";

const RECENT_KEY = "shalko:recent-searches";

const NAV: {
  label: string;
  to: string;
  panel: "productos" | "marcas" | null;
}[] = [
  { label: "Productos", to: "/productos", panel: "productos" },
  { label: "Marcas", to: "/marcas", panel: "marcas" },
  { label: "Servicios", to: "/servicios", panel: null },
  { label: "Contacto", to: "/contacto", panel: null },
  { label: "Garantía", to: "/garantia", panel: null },
];

const MOBILE_PRODUCT_LINKS = [
  { label: "Instrumentos", href: "/productos?cat=Instrumentos" },
  { label: "Audio profesional", href: "/productos?cat=Equipos%20de%20Audio" },
  { label: "Accesorios", href: "/productos?cat=Accesorios" },
  { label: "Equipo de audio", href: "/productos?cat=Equipos%20de%20Audio" },
] as const;

const MOBILE_TRUST_LINKS = [
  { label: "Compra segura", href: "/compra-segura" },
  { label: "Cómo comprar", href: "/como-comprar" },
  { label: "Métodos de pago", href: "/metodos-de-pago" },
] as const;

const QUICK_SEARCHES = [
  "Guitarras eléctricas",
  "Teclados Yamaha",
  "Baterías acústicas",
  "Micrófonos Shure",
  "Mezcladoras",
];

const HEADER_SCROLL_RANGE = 64;

function applyHeaderReveal(el: HTMLElement, scrollY: number) {
  const reveal = Math.min(1, Math.max(0, scrollY / HEADER_SCROLL_RANGE));
  el.style.setProperty("--header-reveal", reveal.toFixed(3));
  el.dataset.state = reveal > 0.3 ? "solid" : "hero";
}

/** Taxonomía del mega menú: `src/lib/navigation/catalog-taxonomy.ts` */

export function SiteHeader({
  products,
  account,
  taxonomy,
  brands,
}: {
  products: HeaderProduct[];
  account: HeaderAccount | null;
  /** Taxonomía real del catálogo (categoría → subcategorías). Fallback estático. */
  taxonomy?: Record<string, string[]>;
  /** Marcas activas reales (nombres) para el menú de Marcas. Fallback estático. */
  brands?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isBelowLg = useIsBelowLg();
  const hasHero = pathname === "/";
  const headerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"productos" | "marcas" | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [megaPanel, setMegaPanel] = useState<"productos" | "marcas" | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  // Solo la home tiene un hero visual a sangre completa: ahí el header arranca
  // integrado (transparente) y se vuelve sólido al hacer scroll. El resto de
  // rutas no tienen hero, por lo que el header inicia sólido para conservar
  // legibilidad sobre fondos claros.
  const { ids: favIds, remove: removeFav, count: favCount } = useFavorites();
  const {
    ids: quoteIds,
    remove: removeQuote,
    count: quoteCount,
    getQuantity: getQuoteQty,
    setQuantity: setQuoteQty,
  } = useQuote();
  const favProducts = useMemo(
    () => products.filter((p) => favIds.includes(p.id)),
    [products, favIds],
  );
  const quoteProducts = useMemo(
    () => products.filter((p) => quoteIds.includes(p.id)),
    [products, quoteIds],
  );
  const quoteRows = useMemo(
    () =>
      quoteIds
        .map((id) => quoteProducts.find((p) => p.id === id))
        .filter((p): p is HeaderProduct => Boolean(p))
        .map((p) => ({ p, qty: getQuoteQty(p.id) || 1 })),
    [quoteIds, quoteProducts, getQuoteQty],
  );
  const quoteTotal = quoteRows.reduce((acc, r) => acc + r.p.price * r.qty, 0);
  const quoteWhatsappHref = useMemo(
    () =>
      buildQuoteWhatsAppHref(
        quoteRows.map((r) => ({
          name: r.p.name,
          quantity: r.qty,
          unitPrice: r.p.price,
        })),
      ),
    [quoteRows],
  );
  const shareLines = useMemo(
    () =>
      quoteRows.map((r) => ({
        productId: r.p.id,
        quantity: r.qty,
        unitPrice: r.p.price,
      })),
    [quoteRows],
  );

  // Mega menú de productos basado en categorías reales del catálogo (con
  // fallback estático). Solo aparecen categorías/subcategorías existentes.
  const categoryTree: Record<string, string[]> =
    taxonomy && Object.keys(taxonomy).length > 0 ? taxonomy : CATEGORY_TREE;

  // Subcategorías que realmente existen en el catálogo: definen qué hojas del
  // mega menú navegan a un filtro real y cuáles son "próximamente".
  const realSubs = useMemo(
    () => new Set(Object.values(categoryTree).flat()),
    [categoryTree],
  );
  const isActiveCatalogItem = (item: CatalogMenuItem) =>
    Boolean(item.sub && realSubs.has(item.sub));

  const goCatalogItem = (item: CatalogMenuItem) => {
    setMegaPanel(null);
    setMobilePanel(null);
    setOpen(false);
    if (item.sub && realSubs.has(item.sub)) {
      goSubcategory(item.sub);
      return;
    }
    if (item.href) {
      router.push(item.href);
      return;
    }
    router.push("/productos");
  };

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    if (!hasHero) {
      el.style.setProperty("--header-reveal", "1");
      el.dataset.state = "solid";
      return;
    }
    applyHeaderReveal(el, window.scrollY);
    if (window.scrollY <= 0) el.dataset.state = "hero";
  }, [hasHero]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el || !hasHero) return;

    let rafId = 0;
    const update = () => {
      rafId = 0;
      const node = headerRef.current;
      if (!node || node.dataset.forcedSolid === "true") return;
      applyHeaderReveal(node, window.scrollY);
    };

    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [hasHero]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  const pushRecent = (term: string) => {
    setRecent((prev) => {
      const next = [term, ...prev.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 6);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const clearRecent = () => {
    setRecent([]);
    try { localStorage.removeItem(RECENT_KEY); } catch {}
  };

  const submitSearch = (q: string) => {
    const term = q.trim();
    if (!term) return;
    pushRecent(term);
    setSearchOpen(false);
    setQuery("");
    router.push(`/productos?q=${encodeURIComponent(term)}`);
  };

  const openPanel = (panel: "productos" | "marcas") => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaPanel(panel);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMegaPanel(null), 120);
  };

  const goSubcategory = (sub: string) => {
    setMegaPanel(null);
    setMobilePanel(null);
    setOpen(false);
    router.push(`/productos?sub=${encodeURIComponent(sub)}`);
  };
  const goCategoryGroup = (cat: string) => {
    setMegaPanel(null);
    setMobilePanel(null);
    setOpen(false);
    router.push(`/productos?cat=${encodeURIComponent(cat)}`);
  };
  const goBrand = (brand: string) => {
    setMegaPanel(null);
    setMobilePanel(null);
    setOpen(false);
    router.push(`/marcas?b=${encodeURIComponent(brand)}`);
  };

  // Group brands by letter ranges similar to Veerkamp. Usa la lista oficial de
  // marcas de la tienda; conserva `brands`/`BRANDS` como respaldo defensivo.
  const brandList =
    OFFICIAL_BRANDS.length > 0 ? OFFICIAL_BRANDS : brands && brands.length > 0 ? brands : BRANDS;
  const sortedBrands = [...brandList].sort((a, b) => a.localeCompare(b));
  const brandColumns: Array<{ label: string; items: string[] }> = (() => {
    const ranges: Array<[string, string]> = [
      ["A", "D"],
      ["E", "H"],
      ["I", "M"],
      ["N", "S"],
      ["T", "Z"],
    ];
    return ranges.map(([from, to]) => ({
      label: `Marcas ${from}–${to}`,
      items: sortedBrands.filter((b) => {
        const c = b[0]?.toUpperCase() ?? "";
        return c >= from && c <= to;
      }),
    }));
  })();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Cerrar el menú de cuenta al hacer clic fuera.
  useEffect(() => {
    if (!accountOpen) return;
    const onDown = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [accountOpen]);

  // Cerrar overlays de navegación con Escape (mega panel, cuenta, menú móvil).
  // Los Sheet de búsqueda/favoritos/carrito manejan Escape por su cuenta.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setMegaPanel(null);
      setAccountOpen(false);
      setOpen(false);
      setMobilePanel(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const closeMobileMenu = () => {
    setOpen(false);
    setMobilePanel(null);
  };

  /** Misma ruta de primer nivel: scroll al tope en lugar de recargar. */
  const isSameNavPage = (to: string) =>
    pathname === to || pathname === `${to}/`;

  const navigateOrScrollTop = (href: string, onAfter?: () => void) => {
    if (isSameNavPage(href)) {
      onAfter?.();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    onAfter?.();
    router.push(href);
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    onAfter?: () => void,
  ) => {
    if (isSameNavPage(href)) {
      e.preventDefault();
      onAfter?.();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      onAfter?.();
    }
  };

  const toggleMobileMenu = () => {
    setOpen((current) => {
      if (current) setMobilePanel(null);
      return !current;
    });
  };

  const headerForcedSolid = !hasHero || megaPanel !== null || open;
  const heroBlend = hasHero && !headerForcedSolid;

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    if (headerForcedSolid) {
      el.style.setProperty("--header-reveal", "1");
      el.dataset.state = "solid";
      return;
    }
    if (hasHero) {
      applyHeaderReveal(el, window.scrollY);
    }
  }, [headerForcedSolid, hasHero]);

  const iconBtn =
    "site-header__icon-btn relative grid h-10 w-10 place-items-center rounded-full transition-colors duration-300 ease-out sm:h-11 sm:w-11";
  const badgeClass =
    "site-header__badge absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-copper px-1 text-[10px] font-semibold tabular-nums text-copper-foreground ring-2";

  return (
    <header
      ref={headerRef}
      className="site-header fixed inset-x-0 top-0 z-50"
      data-has-hero={hasHero ? "true" : "false"}
      data-forced-solid={headerForcedSolid ? "true" : "false"}
      onMouseLeave={scheduleClose}
    >
      <div className="site-header__bg pointer-events-none absolute inset-0 bg-background" aria-hidden />
      {heroBlend && (
        <div
          className="site-header__scrim pointer-events-none absolute inset-x-0 top-0 -z-10 h-28 bg-gradient-to-b from-black/45 via-black/12 to-transparent md:h-32"
          aria-hidden
        />
      )}
      <div className="site-header__bar relative flex h-14 w-full items-center justify-between gap-2 px-4 sm:h-16 sm:px-5 md:h-20 md:px-7 lg:px-10">
        <Link
          href="/"
          className="group relative z-10 flex min-w-0 shrink items-center"
          aria-label={BRAND_ARIA_LABEL}
        >
          <div className="relative lg:hidden">
            {heroBlend && (
              <div className="site-header__logo-light">
                <SiteLogo context="mobileHeader" tone="on-dark" interactive />
              </div>
            )}
            <div className={cn(heroBlend && "site-header__logo-dark absolute inset-0")}>
              <SiteLogo context="mobileHeader" tone="default" interactive />
            </div>
          </div>
          <div className="relative hidden lg:block">
            {heroBlend && (
              <div className="site-header__logo-light">
                <SiteLogo
                  variant="horizontal"
                  context="header"
                  tone="on-dark"
                  interactive
                />
              </div>
            )}
            <div className={cn(heroBlend && "site-header__logo-dark absolute inset-0")}>
              <SiteLogo
                variant="horizontal"
                context="header"
                tone="default"
                interactive
              />
            </div>
          </div>
        </Link>

        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:flex">
          <div className="flex items-center gap-5 xl:gap-9">
            {NAV.map((item) => {
              const isActive = megaPanel === item.panel && Boolean(item.panel);
              return (
                <div
                  key={item.label}
                  onMouseEnter={() => (item.panel ? openPanel(item.panel) : scheduleClose())}
                  className="py-5"
                >
                  <Link
                    href={item.to}
                    onClick={(e) => handleNavClick(e, item.to, () => setMegaPanel(null))}
                    className="site-header__nav-link group relative text-[12px] font-medium uppercase tracking-[0.2em] transition-colors duration-300 ease-out"
                  >
                    {item.label}
                    <span
                      className={cn(
                        "site-header__nav-underline absolute -bottom-1.5 left-0 h-px transition-[width] duration-300 ease-out",
                        isActive ? "w-full" : "w-0 group-hover:w-full",
                      )}
                    />
                  </Link>
                </div>
              );
            })}
          </div>
        </nav>

        <div className="relative z-10 flex shrink-0 items-center justify-end gap-0.5 sm:gap-1.5">
          <button
            aria-label="Buscar"
            onClick={() => setSearchOpen(true)}
            className={iconBtn}
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
          <button
            aria-label={favCount > 0 ? `Favoritos (${favCount})` : "Favoritos"}
            onClick={() => setFavOpen(true)}
            className={cn(iconBtn, "hidden sm:grid")}
          >
            <Heart className="h-[18px] w-[18px]" />
            {favCount > 0 && (
              <span className={badgeClass}>{favCount > 9 ? "9+" : favCount}</span>
            )}
          </button>
          <button
            aria-label={quoteCount > 0 ? `Carrito (${quoteCount})` : "Carrito"}
            onClick={() => setQuoteOpen(true)}
            className={iconBtn}
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {quoteCount > 0 && (
              <span className={badgeClass}>{quoteCount > 9 ? "9+" : quoteCount}</span>
            )}
          </button>

          <span
            className="site-header__divider mx-1 hidden h-5 w-px md:block"
            aria-hidden
          />

          {/* Cuenta */}
          <div className="relative" ref={accountRef}>
            {account ? (
              <>
                <button
                  aria-label="Mi cuenta"
                  aria-expanded={accountOpen}
                  onClick={() => {
                    if (isBelowLg) {
                      setAccountOpen(false);
                      setOpen(true);
                      return;
                    }
                    setAccountOpen((v) => !v);
                  }}
                  className={iconBtn}
                >
                  <User className="h-[18px] w-[18px]" />
                  {(account.hasOrderAttention || (account.unreadNotifications ?? 0) > 0) && (
                    <span
                      className="site-header__account-dot absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2"
                      aria-hidden
                    />
                  )}
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-12 z-[60] hidden w-72 origin-top-right rounded-2xl border border-border/70 bg-background p-1.5 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.18)] animate-in fade-in slide-in-from-top-1 duration-200 md:block">
                    <div className="flex items-center gap-3 px-2.5 py-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground text-sm font-semibold text-background">
                        {(account.email?.[0] ?? "U").toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium capitalize text-foreground">
                          {account.email?.split("@")[0] ?? "Mi cuenta"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {account.email}
                        </p>
                      </div>
                    </div>
                    <div className="my-1 h-px bg-border/60" />
                    <Link href="/cuenta" onClick={() => setAccountOpen(false)} className={ACCOUNT_ITEM}>
                      <User className="h-4 w-4 text-muted-foreground" />
                      Mi cuenta
                    </Link>
                    {account.isAdmin ? (
                      <>
                        <Link href="/admin" onClick={() => setAccountOpen(false)} className={ACCOUNT_ITEM}>
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          Panel admin
                        </Link>
                        <Link href="/admin/pedidos" onClick={() => setAccountOpen(false)} className={ACCOUNT_ITEM}>
                          <Package className="h-4 w-4 text-muted-foreground" />
                          Pedidos de clientes
                          {account.hasOrderAttention && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden />
                          )}
                        </Link>
                        <Link href="/carrito" onClick={() => setAccountOpen(false)} className={ACCOUNT_ITEM}>
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                          Carrito tienda
                          {(account.cartItemCount ?? 0) > 0 && (
                            <span className="ml-auto text-[11px] font-medium text-muted-foreground">
                              {account.cartItemCount} producto{account.cartItemCount === 1 ? "" : "s"}
                            </span>
                          )}
                        </Link>
                        <Link href="/cuenta/notificaciones" onClick={() => setAccountOpen(false)} className={ACCOUNT_ITEM}>
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          Notificaciones
                          {(account.unreadNotifications ?? 0) > 0 && (
                            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                              {account.unreadNotifications}
                            </span>
                          )}
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href="/cuenta/notificaciones" onClick={() => setAccountOpen(false)} className={ACCOUNT_ITEM}>
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          Notificaciones
                          {(account.unreadNotifications ?? 0) > 0 && (
                            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                              {account.unreadNotifications}
                            </span>
                          )}
                        </Link>
                        <Link href="/cuenta/pedidos" onClick={() => setAccountOpen(false)} className={ACCOUNT_ITEM}>
                          <Package className="h-4 w-4 text-muted-foreground" />
                          Mis pedidos
                          {account.hasOrderAttention && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden />
                          )}
                        </Link>
                        <Link href="/favoritos" onClick={() => setAccountOpen(false)} className={ACCOUNT_ITEM}>
                          <Heart className="h-4 w-4 text-muted-foreground" />
                          Favoritos
                        </Link>
                        <Link href="/carrito" onClick={() => setAccountOpen(false)} className={ACCOUNT_ITEM}>
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                          Mi carrito
                          {(account.cartItemCount ?? 0) > 0 && (
                            <span className="ml-auto text-[11px] font-medium text-muted-foreground">
                              {account.cartItemCount} producto{account.cartItemCount === 1 ? "" : "s"}
                            </span>
                          )}
                        </Link>
                      </>
                    )}
                    <div className="my-1 h-px bg-border/60" />
                    <Link href="/cuenta#seguridad" onClick={() => setAccountOpen(false)} className={ACCOUNT_ITEM}>
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      Seguridad
                    </Link>
                    <div className="my-1 h-px bg-border/60" />
                    <form action={signOut}>
                      <button type="submit" className={ACCOUNT_ITEM}>
                        <LogOut className="h-4 w-4 text-muted-foreground" />
                        Cerrar sesión
                      </button>
                    </form>
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/login"
                aria-label="Iniciar sesión"
                className={iconBtn}
              >
                <User className="h-[18px] w-[18px]" />
              </Link>
            )}
          </div>

          <button
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={toggleMobileMenu}
            className={cn(iconBtn, "lg:hidden")}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mega panel */}
      <div
        onMouseEnter={() => megaPanel && openPanel(megaPanel)}
        onMouseLeave={scheduleClose}
        className={cn(
          "site-header__mega hidden overflow-hidden border-t border-border/25 bg-background shadow-[0_20px_44px_-28px_rgba(0,0,0,0.14)] transition-[max-height,opacity] duration-300 ease-out lg:block",
          megaPanel
            ? "max-h-[560px] overflow-visible opacity-100"
            : "pointer-events-none max-h-0 overflow-hidden opacity-0",
        )}
      >
        {megaPanel === "productos" && (
          <ProductsMegaMenu
            isActiveItem={isActiveCatalogItem}
            onCategory={goCategoryGroup}
            onItem={goCatalogItem}
          />
        )}

        {megaPanel === "marcas" && (
          <BrandsMegaMenu
            brandColumns={brandColumns}
            sortedBrands={sortedBrands}
            onBrand={goBrand}
            onViewAll={() => navigateOrScrollTop("/marcas", () => setMegaPanel(null))}
          />
        )}
      </div>

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 top-14 z-40 bg-black/35 backdrop-blur-[3px] animate-in fade-in duration-300 sm:top-16 lg:hidden"
            onClick={closeMobileMenu}
          />
          <div className="relative z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-border/60 bg-background/98 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.18)] backdrop-blur-xl animate-in slide-in-from-top-2 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:max-h-[calc(100dvh-4rem)] lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-5 py-5 sm:py-6">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Menú
              </span>
              <span className="ml-3 h-px flex-1 bg-gradient-to-r from-border via-border/40 to-transparent" />
            </div>

            {/* Productos accordion */}
            <MobileAccordion
              index="01"
              label="Productos"
              isOpen={mobilePanel === "productos"}
              onToggle={() => setMobilePanel((p) => (p === "productos" ? null : "productos"))}
            >
              <ul className="space-y-0.5 pb-3 pt-1">
                {MOBILE_PRODUCT_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href, closeMobileMenu)}
                      className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm text-foreground/85 transition-colors hover:bg-muted/50 hover:text-foreground"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </Link>
                  </li>
                ))}
                <li className="pt-1">
                  <Link
                    href="/productos"
                    onClick={(e) => handleNavClick(e, "/productos", closeMobileMenu)}
                    className="inline-flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-copper"
                  >
                    Ver catálogo completo
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              </ul>
            </MobileAccordion>

            {/* Marcas accordion */}
            <MobileAccordion
              index="02"
              label="Marcas"
              isOpen={mobilePanel === "marcas"}
              onToggle={() => setMobilePanel((p) => (p === "marcas" ? null : "marcas"))}
            >
              <div className="pb-4 pt-2">
                <ul className="flex flex-wrap gap-1.5">
                  {sortedBrands.map((b) => (
                    <li key={b}>
                      <button
                        onClick={() => goBrand(b)}
                        className="rounded-full border border-border/70 bg-card px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-foreground/80 transition-colors hover:border-copper/60 hover:bg-copper/10 hover:text-copper"
                      >
                        {b}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigateOrScrollTop("/marcas", closeMobileMenu)}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-copper transition-[gap,transform] duration-300 hover:gap-2"
                >
                  Ver todas las marcas
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </MobileAccordion>

            {NAV.filter((n) => !n.panel).map((item, i) => (
              <Link
                key={item.label}
                href={item.to}
                onClick={(e) => handleNavClick(e, item.to, closeMobileMenu)}
                className="group flex items-center justify-between border-t border-border/60 px-1 py-4 transition-[color,transform] duration-300 hover:translate-x-0.5 hover:text-copper"
              >
                <span className="flex items-baseline gap-3">
                  <span className="text-[10px] font-mono text-muted-foreground/70 transition-colors group-hover:text-copper/70">
                    {String(i + 3).padStart(2, "0")}
                  </span>
                  <span className="font-display text-base font-medium text-foreground/90 transition-colors group-hover:text-copper">
                    {item.label}
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-copper" />
              </Link>
            ))}

            <div className="mt-2 border-t border-border/60 pt-3">
              <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Compra asistida
              </p>
              <ul className="mt-2 space-y-0.5">
                {MOBILE_TRUST_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href, closeMobileMenu)}
                      className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm text-foreground/85 transition-colors hover:bg-muted/50 hover:text-foreground"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cuenta (móvil) */}
            <div className="mt-4 border-t border-border/60 pt-4">
              {account ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-1 pb-2">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground text-sm font-semibold text-background">
                      {(account.email?.[0] ?? "U").toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium capitalize text-foreground">
                        {account.email?.split("@")[0] ?? "Mi cuenta"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {account.email}
                      </p>
                    </div>
                  </div>
                  <Link href="/cuenta" onClick={closeMobileMenu} className={ACCOUNT_ITEM}>
                    <User className="h-4 w-4 text-muted-foreground" />
                    Mi cuenta
                  </Link>
                  {account.isAdmin ? (
                    <>
                      <Link href="/admin" onClick={closeMobileMenu} className={ACCOUNT_ITEM}>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        Panel admin
                      </Link>
                      <Link href="/admin/pedidos" onClick={closeMobileMenu} className={ACCOUNT_ITEM}>
                        <Package className="h-4 w-4 text-muted-foreground" />
                        Pedidos de clientes
                        {account.hasOrderAttention && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden />
                        )}
                      </Link>
                      <Link href="/carrito" onClick={closeMobileMenu} className={ACCOUNT_ITEM}>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        Carrito tienda
                        {(account.cartItemCount ?? 0) > 0 && (
                          <span className="ml-auto text-[11px] font-medium text-muted-foreground">
                            {account.cartItemCount} producto{account.cartItemCount === 1 ? "" : "s"}
                          </span>
                        )}
                      </Link>
                      <Link href="/cuenta/notificaciones" onClick={closeMobileMenu} className={ACCOUNT_ITEM}>
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        Notificaciones
                        {(account.unreadNotifications ?? 0) > 0 && (
                          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                            {account.unreadNotifications}
                          </span>
                        )}
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/cuenta/notificaciones" onClick={closeMobileMenu} className={ACCOUNT_ITEM}>
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        Notificaciones
                        {(account.unreadNotifications ?? 0) > 0 && (
                          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                            {account.unreadNotifications}
                          </span>
                        )}
                      </Link>
                      <Link href="/cuenta/pedidos" onClick={closeMobileMenu} className={ACCOUNT_ITEM}>
                        <Package className="h-4 w-4 text-muted-foreground" />
                        Mis pedidos
                        {account.hasOrderAttention && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden />
                        )}
                      </Link>
                      <Link href="/favoritos" onClick={closeMobileMenu} className={ACCOUNT_ITEM}>
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        Favoritos
                      </Link>
                      <Link href="/carrito" onClick={closeMobileMenu} className={ACCOUNT_ITEM}>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        Mi carrito
                        {(account.cartItemCount ?? 0) > 0 && (
                          <span className="ml-auto text-[11px] font-medium text-muted-foreground">
                            {account.cartItemCount} producto{account.cartItemCount === 1 ? "" : "s"}
                          </span>
                        )}
                      </Link>
                    </>
                  )}
                  <Link href="/cuenta#seguridad" onClick={closeMobileMenu} className={ACCOUNT_ITEM}>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Seguridad
                  </Link>
                  <form action={signOut}>
                    <button type="submit" className={ACCOUNT_ITEM}>
                      <LogOut className="h-4 w-4 text-muted-foreground" />
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-copper/60 hover:text-copper"
                >
                  <User className="h-4 w-4" />
                  Iniciar sesión
                </Link>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-border/60 bg-gradient-to-br from-muted/40 via-background to-transparent p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                ¿Necesitas ayuda?
              </p>
              <p className="mt-1.5 font-display text-base font-light leading-snug">
                Asesoría personalizada por WhatsApp.
              </p>
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-copper"
              >
                Escribir ahora
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </nav>
          </div>
        </>
      )}

      {/* Search panel */}
      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent
          side="top"
          className="border-b border-border/60 bg-background p-0 sm:max-h-[92vh]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Buscar en Radio Shalko</SheetTitle>
            <SheetDescription>Encuentra instrumentos, marcas y accesorios.</SheetDescription>
          </SheetHeader>

          <SearchPanel
            products={products}
            query={query}
            setQuery={setQuery}
            onSubmit={submitSearch}
            recent={recent}
            clearRecent={clearRecent}
            onPickBrand={(b) => {
              setSearchOpen(false);
              setQuery("");
              router.push(`/marcas?b=${encodeURIComponent(b)}`);
            }}
            onPickSub={(sub) => {
              setSearchOpen(false);
              setQuery("");
              router.push(`/productos?sub=${encodeURIComponent(sub)}`);
            }}
            onPickTerm={(term) => submitSearch(term)}
            onPickProductSlug={(slug) => {
              setSearchOpen(false);
              setQuery("");
              router.push(`/productos/${slug}`);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Carrito — panel lateral */}
      <Sheet open={quoteOpen} onOpenChange={setQuoteOpen}>
        <SheetContent
          side="right"
          className={cn(
            "flex h-full w-full flex-col gap-0 overflow-hidden border-l border-border/80 bg-background p-0 sm:max-w-[400px]",
            PANEL_SHEET_CLOSE,
          )}
        >
          <div className="shrink-0 border-b border-border/80 px-5 pb-5 pt-6 pr-14">
            <SheetHeader className="space-y-1.5 text-left">
              <SheetTitle className="font-display text-[1.35rem] font-semibold tracking-tight">
                Tu carrito
              </SheetTitle>
              <SheetDescription className="text-[13px] leading-snug text-muted-foreground">
                {quoteRows.length === 0
                  ? "Aún no agregas productos."
                  : `${quoteRows.length} producto${quoteRows.length === 1 ? "" : "s"}`}
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-2">
            {quoteRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-2 py-16 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full border border-border/80 bg-muted/30">
                  <ShoppingBag className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                </span>
                <p className="mt-4 text-sm font-medium text-foreground">Tu carrito está vacío</p>
                <p className="mt-1 max-w-[220px] text-[13px] leading-relaxed text-muted-foreground">
                  Explora el catálogo y agrega lo que te interese.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuoteOpen(false);
                    router.push("/productos");
                  }}
                  className={cn(panelBtnPrimary, "mt-6 max-w-[240px]")}
                >
                  Explorar catálogo
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-border/70">
                {quoteRows.map(({ p, qty }) => (
                  <li key={p.id} className="flex gap-3.5 py-4">
                    <Link
                      href={`/productos/${p.slug}`}
                      onClick={() => setQuoteOpen(false)}
                      className="h-[4.25rem] w-[4.25rem] shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/40"
                    >
                      {p.image && (
                        <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                      )}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/productos/${p.slug}`}
                          onClick={() => setQuoteOpen(false)}
                          className="min-w-0"
                        >
                          {p.brand && (
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                              {p.brand}
                            </p>
                          )}
                          <p className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground">
                            {p.name}
                          </p>
                        </Link>
                        <button
                          aria-label="Quitar"
                          onClick={() => removeQuote(p.id)}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <QuantityStepper
                          value={qty}
                          size="sm"
                          onChange={(next) => setQuoteQty(p.id, next)}
                        />
                        <span className={typography.priceInline}>{formatPrice(p.price * qty)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {quoteRows.length > 0 && (
            <div className="shrink-0 border-t border-border/80 bg-background px-5 py-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className={siteShell.labelCaps}>Total estimado</p>
                <p className={typography.priceTotal}>{formatPrice(quoteTotal)}</p>
              </div>

              <div className="mt-4 space-y-2.5">
                {account?.isAdmin ? (
                  <CartShareActions lines={shareLines} variant="primary" compact />
                ) : (
                  <a
                    href={quoteWhatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setQuoteOpen(false)}
                    className={panelBtnPrimary}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Solicitar asesoría
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setQuoteOpen(false);
                    router.push("/carrito");
                  }}
                  className={panelBtnSecondary}
                >
                  Ver carrito
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuoteOpen(false);
                    router.push("/productos");
                  }}
                  className="w-full py-1 text-center text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Seguir explorando
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Favorites panel */}
      <Sheet open={favOpen} onOpenChange={setFavOpen}>
        <SheetContent
          side="right"
          className={cn(
            "flex h-full w-full flex-col gap-0 overflow-hidden border-l border-border/80 bg-background p-0 sm:max-w-[400px]",
            PANEL_SHEET_CLOSE,
          )}
        >
          <div className="shrink-0 border-b border-border/80 px-5 pb-5 pt-6 pr-14">
            <SheetHeader className="space-y-1.5 text-left">
              <SheetTitle className="font-display text-[1.35rem] font-semibold tracking-tight">
                Tus favoritos
              </SheetTitle>
              <SheetDescription className="text-[13px] leading-snug text-muted-foreground">
                {favProducts.length === 0
                  ? "Aún no has guardado productos."
                  : `${favProducts.length} producto${favProducts.length === 1 ? "" : "s"} guardado${favProducts.length === 1 ? "" : "s"}.`}
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-2">
            {favProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-2 py-16 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full border border-border/80 bg-muted/30">
                  <Heart className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                </span>
                <p className="mt-4 text-sm font-medium text-foreground">Sin favoritos aún</p>
                <p className="mt-1 max-w-[240px] text-[13px] leading-relaxed text-muted-foreground">
                  Toca el corazón en cualquier producto para guardarlo aquí.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/70">
                {favProducts.map((p) => (
                  <li key={p.id} className="flex items-center gap-3.5 py-4">
                    <Link
                      href={`/productos/${p.slug}`}
                      onClick={() => setFavOpen(false)}
                      className="flex min-w-0 flex-1 items-center gap-3.5"
                    >
                      <div className="h-[4.25rem] w-[4.25rem] shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/40">
                        <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {p.brand}
                        </p>
                        <p className="truncate text-[13px] font-medium text-foreground">{p.name}</p>
                        <p className={cn(typography.priceInline, "mt-1 text-[14px]")}>
                          {formatPrice(p.price)}
                        </p>
                      </div>
                    </Link>
                    <button
                      aria-label="Quitar"
                      onClick={() => removeFav(p.id)}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="shrink-0 border-t border-border/80 px-5 py-5">
            <div className="flex flex-col gap-2.5">
              <Link
                href="/favoritos"
                onClick={() => setFavOpen(false)}
                className={panelBtnPrimary}
              >
                Ver panel completo
              </Link>
              <button
                type="button"
                onClick={() => {
                  setFavOpen(false);
                  router.push("/productos");
                }}
                className={panelBtnSecondary}
              >
                Seguir explorando
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

function MobileAccordion({
  index,
  label,
  isOpen,
  onToggle,
  children,
}: {
  index?: string;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-border/60 first:border-t-0">
      <button
        onClick={onToggle}
        className={`group flex w-full items-center justify-between px-1 py-4 transition-[color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "text-copper" : "text-foreground/90 hover:translate-x-0.5 hover:text-copper"
        }`}
        aria-expanded={isOpen}
      >
        <span className="flex items-baseline gap-3">
          {index && (
            <span className="text-[10px] font-mono text-muted-foreground/70 transition-colors group-hover:text-copper/70">
              {index}
            </span>
          )}
          <span className="font-display text-base font-medium">{label}</span>
        </span>
        <span
          className={`grid h-7 w-7 place-items-center rounded-full border transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isOpen
              ? "border-copper bg-copper/10 text-copper"
              : "border-border text-muted-foreground group-hover:border-copper/60 group-hover:text-copper"
          }`}
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden px-1">
          <div className={isOpen ? "pb-4 pt-2" : ""}>{children}</div>
        </div>
      </div>
    </div>
  );
}

function SearchPanel({
  products,
  query,
  setQuery,
  onSubmit,
  recent,
  clearRecent,
  onPickBrand,
  onPickSub,
  onPickTerm,
  onPickProductSlug,
}: {
  products: HeaderProduct[];
  query: string;
  setQuery: (v: string) => void;
  onSubmit: (q: string) => void;
  recent: string[];
  clearRecent: () => void;
  onPickBrand: (b: string) => void;
  onPickSub: (sub: string) => void;
  onPickTerm: (term: string) => void;
  onPickProductSlug: (slug: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  const q = query.trim().toLowerCase();
  const hasQuery = q.length > 0;

  const results = useMemo(() => {
    if (!hasQuery) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [products, q, hasQuery]);

  const SUGGESTIONS = ["Guitarras eléctricas", "Teclados", "Baterías", "Mezcladoras"];
  const featuredBrands = FEATURED_BRAND_CANDIDATES;

  return (
    <div className="mx-auto flex max-h-[88vh] w-full max-w-2xl flex-col px-5 pt-8 pb-8 md:px-6 md:pt-10">
      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(query);
        }}
        className="border-b border-border/70 pb-4"
      >
        <div className="flex items-center gap-3">
          <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground/80" strokeWidth={1.75} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca instrumentos, marcas, accesorios…"
            className="w-full bg-transparent text-lg font-medium tracking-normal text-foreground placeholder:text-muted-foreground/45 focus:outline-none md:text-[1.35rem]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Limpiar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Body */}
      <div className="mt-6 flex-1 overflow-y-auto">
        {!hasQuery ? (
          <div className="space-y-7">
            {recent.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    Recientes
                  </p>
                  <button
                    onClick={clearRecent}
                    className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-copper"
                  >
                    Borrar
                  </button>
                </div>
                <ul>
                  {recent.slice(0, 4).map((r) => (
                    <li key={r}>
                      <button
                        onClick={() => onPickTerm(r)}
                        className="group flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm text-foreground/85 hover:bg-muted"
                      >
                        <span className="flex items-center gap-3 truncate">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {r}
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-copper" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Sugerencias
              </p>
              <ul>
                {SUGGESTIONS.map((s) => (
                  <li key={s}>
                    <button
                      onClick={() => onPickSub(s)}
                      className="group flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm text-foreground/85 hover:bg-muted"
                    >
                      <span>{s}</span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-copper" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Marcas
              </p>
              <div className="flex flex-wrap gap-2">
                {featuredBrands.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => onPickBrand(b)}
                    className="rounded-md border border-border/40 bg-background px-3 py-1.5 text-[12.5px] font-medium text-foreground/85 transition-colors hover:border-foreground/25 hover:bg-muted/40 hover:text-foreground"
                  >
                    {b}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div>
            {results.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
                <p className="font-display text-lg font-light">Sin coincidencias</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Prueba con otra palabra.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => onPickProductSlug(p.slug)}
                      className="group flex w-full items-center gap-4 py-3 text-left"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-inset ring-border">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          {p.brand}
                        </p>
                        <p className="truncate text-sm font-medium text-foreground group-hover:text-copper">
                          {p.name}
                        </p>
                      </div>
                      <span className={cn(typography.priceInline, "hidden sm:inline")}>
                        {formatPrice(p.price)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              onClick={() => onSubmit(query)}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-copper hover:underline"
            >
              Ver todos los resultados →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
