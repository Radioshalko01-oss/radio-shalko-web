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
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BRANDS, CATEGORY_TREE, formatPrice } from "@/lib/products";
import { useFavorites } from "@/hooks/use-favorites";
import { useQuote } from "@/hooks/use-quote";
import { signOut } from "@/lib/auth/actions";
import { SiteLogo } from "@/components/brand/site-logo";
import { BRAND_ARIA_LABEL } from "@/lib/brand/assets";

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

const MEGA_ITEM =
  "text-left transition-[color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-0.5 hover:text-foreground focus-visible:translate-x-0.5 focus-visible:text-foreground focus-visible:outline-none";

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

const QUICK_SEARCHES = [
  "Guitarras eléctricas",
  "Teclados Yamaha",
  "Baterías acústicas",
  "Micrófonos Shure",
  "Mezcladoras",
];

/**
 * Taxonomía comercial del mega menú de Productos.
 *
 * `sub` apunta al nombre EXACTO de una subcategoría que existe en el catálogo.
 * Si una hoja tiene `sub` y esa subcategoría existe en Supabase, navega al filtro
 * real (`/productos?sub=...`). Si no tiene `sub` (o aún no existe en BD), se trata
 * como categoría futura: estilo sutil y enlace a `/productos` sin filtrar.
 *
 * No modifica filtros ni base de datos: es solo la capa de presentación del menú.
 */
type MegaLeaf = { label: string; sub?: string };
type MegaGroup = { title: string; items: MegaLeaf[] };
type MegaColumn = { title: string; cat: string; groups: MegaGroup[] };

const PRODUCT_MENU: MegaColumn[] = [
  {
    title: "Instrumentos",
    cat: "Instrumentos",
    groups: [
      {
        title: "Cuerda",
        items: [
          { label: "Guitarras acústicas", sub: "Guitarras acústicas" },
          { label: "Guitarras eléctricas", sub: "Guitarras eléctricas" },
          { label: "Bajos eléctricos", sub: "Bajos" },
          { label: "Bajos acústicos" },
          { label: "Docerolas", sub: "Docerolas" },
          { label: "Violines", sub: "Violines" },
          { label: "Ukuleles", sub: "Ukuleles" },
          { label: "Mandolinas" },
        ],
      },
      {
        title: "Teclados",
        items: [{ label: "Teclados", sub: "Teclados" }],
      },
      {
        title: "Percusión",
        items: [
          { label: "Baterías", sub: "Baterías" },
          { label: "Bongos" },
          { label: "Tarolas" },
          { label: "Xilófonos" },
        ],
      },
      {
        title: "Viento",
        items: [
          { label: "Trompetas" },
          { label: "Cornetas" },
          { label: "Flautas" },
          { label: "Melódicas" },
          { label: "Armónicas" },
          { label: "Acordeones" },
        ],
      },
    ],
  },
  {
    title: "Accesorios",
    cat: "Accesorios",
    groups: [
      {
        title: "Para tu instrumento",
        items: [
          { label: "Cuerdas" },
          { label: "Pedales de efectos", sub: "Pedales" },
          { label: "Pedal de sustain" },
          { label: "Amplificadores de guitarra", sub: "Amplificadores" },
          { label: "Amplificadores de bajo" },
          { label: "Cables", sub: "Cables" },
          { label: "Audífonos" },
          { label: "Interfaces" },
          { label: "Pastillas" },
          { label: "Afinadores" },
          { label: "Capotrastes" },
        ],
      },
      {
        title: "Soportes y protección",
        items: [
          { label: "Pedestales de micrófono" },
          { label: "Bases de teclado" },
          { label: "Atriles" },
          { label: "Fundas y estuches" },
        ],
      },
    ],
  },
  {
    title: "Equipos de Audio",
    cat: "Equipos de Audio",
    groups: [
      {
        title: "Audio profesional",
        items: [
          { label: "Bafles", sub: "Bafles" },
          { label: "Subwoofers" },
          { label: "Bocinas" },
          { label: "Mezcladoras", sub: "Mezcladoras" },
          { label: "Amplificadores de potencia" },
          { label: "Micrófonos" },
          { label: "Interfaces de audio" },
          { label: "Crossover" },
          { label: "Switcheras" },
        ],
      },
      {
        title: "Iluminación",
        items: [{ label: "DMX" }, { label: "Luces" }],
      },
    ],
  },
];

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
  const [scrolled, setScrolled] = useState(false);
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
  const router = useRouter();
  const pathname = usePathname();
  // Solo la home tiene un hero visual a sangre completa: ahí el header arranca
  // integrado (transparente) y se vuelve sólido al hacer scroll. El resto de
  // rutas no tienen hero, por lo que el header inicia sólido para conservar
  // legibilidad sobre fondos claros.
  const hasHero = pathname === "/";
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
  const isRealLeaf = (leaf: MegaLeaf) => Boolean(leaf.sub && realSubs.has(leaf.sub));
  const goLeaf = (leaf: MegaLeaf) => {
    if (leaf.sub && realSubs.has(leaf.sub)) {
      goSubcategory(leaf.sub);
      return;
    }
    setMegaPanel(null);
    setMobilePanel(null);
    setOpen(false);
    router.push("/productos");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  // Group brands by letter ranges similar to Veerkamp. Usa marcas activas reales
  // si se proveen; si no, cae al listado estático para no romper el menú.
  const brandList = brands && brands.length > 0 ? brands : BRANDS;
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

  const toggleMobileMenu = () => {
    setOpen((current) => {
      if (current) setMobilePanel(null);
      return !current;
    });
  };

  const headerSolid = scrolled || megaPanel !== null || open;
  // Estado "integrado al hero": solo en home, en el tope, sin paneles abiertos.
  const transparent = hasHero && !headerSolid;

  // Botón de icono que adapta su color al estado del header (claro sobre hero,
  // neutro sobre panel sólido).
  const iconBtn = cn(
    "relative grid h-10 w-10 place-items-center rounded-full transition-colors duration-[250ms] ease-out",
    transparent
      ? "text-white hover:bg-white/12"
      : "text-foreground/80 hover:bg-muted hover:text-foreground",
  );
  const badgeClass = cn(
    "absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-semibold tabular-nums ring-2 transition-colors",
    transparent
      ? "bg-copper text-copper-foreground ring-transparent"
      : "bg-copper text-copper-foreground ring-background",
  );

  return (
    <header
      className={cn(
        "relative fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-[250ms] ease-out",
        transparent
          ? "bg-transparent"
          : "bg-background shadow-[0_1px_0_0_rgba(0,0,0,0.06)]",
      )}
      data-state={transparent ? "hero" : "solid"}
      onMouseLeave={scheduleClose}
    >
      {/* Scrim sobre el hero: degradado extendido sin borde duro al pie del header */}
      {transparent && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-28 bg-gradient-to-b from-black/50 via-black/15 to-transparent md:h-32"
          aria-hidden
        />
      )}
      <div className="relative flex h-16 w-full items-center justify-between px-5 md:h-20 md:px-7 lg:px-10">
        <Link
          href="/"
          className="group relative z-10 flex shrink-0 items-center"
          aria-label={BRAND_ARIA_LABEL}
        >
          <SiteLogo
            variant="horizontal"
            context="header"
            tone={transparent ? "on-dark" : "default"}
            interactive
          />
        </Link>

        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex">
          <div className="flex items-center gap-7 lg:gap-9">
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
                    onClick={() => setMegaPanel(null)}
                    className={cn(
                      "group relative text-[12px] font-medium uppercase tracking-[0.2em] transition-colors",
                      transparent
                        ? "text-white/90 hover:text-white"
                        : "text-foreground/80 hover:text-foreground",
                    )}
                  >
                    {item.label}
                    <span
                      className={cn(
                        "absolute -bottom-1.5 left-0 h-px transition-[width,background-color] duration-[250ms] ease-out",
                        transparent ? "bg-white/90" : "bg-copper",
                        isActive ? "w-full" : "w-0 group-hover:w-full",
                      )}
                    />
                  </Link>
                </div>
              );
            })}
          </div>
        </nav>

        <div className="relative z-10 flex shrink-0 items-center justify-end gap-1.5">
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
            className={iconBtn}
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
            className={cn(
              "mx-1 hidden h-5 w-px md:block",
              transparent ? "bg-white/25" : "bg-border/70",
            )}
            aria-hidden
          />

          {/* Cuenta */}
          <div className="relative" ref={accountRef}>
            {account ? (
              <>
                <button
                  aria-label="Mi cuenta"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen((v) => !v)}
                  className={iconBtn}
                >
                  <User className="h-[18px] w-[18px]" />
                  {(account.hasOrderAttention || (account.unreadNotifications ?? 0) > 0) && (
                    <span
                      className={cn(
                        "absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2",
                        transparent
                          ? "bg-copper ring-transparent"
                          : "bg-foreground ring-background",
                      )}
                      aria-hidden
                    />
                  )}
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-12 z-[60] w-72 origin-top-right rounded-2xl border border-border/70 bg-background p-1.5 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.18)] animate-in fade-in slide-in-from-top-1 duration-200">
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
            className={cn(iconBtn, "md:hidden")}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mega panel */}
      <div
        onMouseEnter={() => megaPanel && openPanel(megaPanel)}
        onMouseLeave={scheduleClose}
        className={`hidden overflow-hidden border-t border-border/60 bg-background shadow-[0_28px_50px_-26px_rgba(0,0,0,0.28)] transition-[max-height,opacity] duration-300 ease-out md:block ${
          megaPanel
            ? "max-h-[560px] opacity-100"
            : "pointer-events-none max-h-0 opacity-0"
        }`}
      >
        {megaPanel === "productos" && (
          <div className="mx-auto grid max-w-7xl grid-cols-12 gap-x-10 px-8 py-8">
            {/* Familias con grupos editoriales */}
            <div className="col-span-9 grid grid-cols-3 gap-x-10">
              {PRODUCT_MENU.map((col) => {
                const displayTitle =
                  col.title === "Equipos de Audio" ? "Audio profesional" : col.title;
                return (
                  <div key={col.title} className="min-w-0">
                    <button
                      onClick={() => goCategoryGroup(col.cat)}
                      className="group/col mb-4 flex w-full items-center gap-1.5 border-b border-border/60 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground transition-colors hover:text-copper"
                    >
                      {displayTitle}
                      <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-copper opacity-0 transition-all duration-200 group-hover/col:translate-x-0.5 group-hover/col:-translate-y-0.5 group-hover/col:opacity-100" />
                    </button>
                    <div className="max-h-[360px] space-y-4 overflow-y-auto overscroll-contain pr-1">
                      {col.groups.map((group) => (
                        <div key={group.title}>
                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                            {group.title}
                          </p>
                          <ul className="space-y-0.5">
                            {group.items.map((leaf) => (
                              <li key={leaf.label}>
                                <button
                                  onClick={() => goLeaf(leaf)}
                                  className={`block w-full text-left text-[13px] leading-snug ${MEGA_ITEM} ${
                                    isRealLeaf(leaf)
                                      ? "text-foreground/80"
                                      : "text-muted-foreground/40"
                                  }`}
                                >
                                  {leaf.label}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rail de acciones */}
            <aside className="col-span-3">
              <div className="flex h-full flex-col justify-between rounded-2xl border border-border/70 bg-gradient-to-br from-muted/50 via-background to-background p-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-copper">
                    Radio Shalko
                  </p>
                  <p className="mt-2 font-display text-lg font-light leading-snug text-foreground">
                    Explora instrumentos, accesorios y audio profesional.
                  </p>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                    Recolección en tienda y asesoría personalizada.
                  </p>
                </div>
                <div className="mt-5 space-y-2">
                  <button
                    onClick={() => {
                      setMegaPanel(null);
                      router.push("/productos");
                    }}
                    className="inline-flex w-full items-center justify-between gap-2 rounded-full bg-foreground px-4 py-2.5 text-[12.5px] font-medium text-background transition-[gap,opacity] duration-300 hover:opacity-90"
                  >
                    Ver todo el catálogo
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => goCategoryGroup("Equipos de Audio")}
                    className="inline-flex w-full items-center justify-between gap-2 rounded-full border border-border px-4 py-2.5 text-[12.5px] font-medium text-foreground/80 transition-colors hover:border-copper/50 hover:text-copper"
                  >
                    Audio profesional
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                  <a
                    href={whatsappHref()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-copper"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Asesoría por WhatsApp
                  </a>
                </div>
              </div>
            </aside>
          </div>
        )}

        {megaPanel === "marcas" && (
          <div className="mx-auto max-w-7xl px-8 py-8">
            <div className="mb-6 flex items-end justify-between border-b border-border/60 pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-copper">
                  Catálogo por fabricante
                </p>
                <p className="mt-1.5 font-display text-lg font-light leading-tight text-foreground">
                  Explorar marcas
                </p>
              </div>
              <button
                onClick={() => {
                  setMegaPanel(null);
                  router.push("/marcas");
                }}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-foreground/80 transition-[gap,color] duration-300 hover:gap-2.5 hover:text-copper"
              >
                Ver todas las marcas
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid max-h-[360px] grid-cols-5 gap-x-10 overflow-y-auto overscroll-contain pr-1">
              {brandColumns.map((col) => (
                <div key={col.label}>
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                    {col.label}
                  </p>
                  <ul className="space-y-0.5">
                    {col.items.length > 0 ? (
                      col.items.map((b) => (
                        <li key={b}>
                          <button
                            onClick={() => goBrand(b)}
                            className={`block w-full text-left text-[13px] text-foreground/80 ${MEGA_ITEM}`}
                          >
                            {b}
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className="text-[12.5px] text-muted-foreground/40">—</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 top-16 z-40 bg-black/35 backdrop-blur-[3px] animate-in fade-in duration-300 md:hidden"
            onClick={closeMobileMenu}
          />
          <div className="relative z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border/60 bg-background/98 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.18)] backdrop-blur-xl animate-in slide-in-from-top-2 duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-5 py-6">
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
              <div className="space-y-4 pb-4 pt-2">
                {PRODUCT_MENU.map((col) => (
                  <div key={col.title} className="rounded-xl border border-border/50 bg-card/60 p-3.5">
                    <button
                      onClick={() => goCategoryGroup(col.cat)}
                      className="group flex w-full items-center justify-between text-left"
                    >
                      <span className="font-display text-sm font-semibold tracking-tight text-foreground">
                        {col.title}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-copper/70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                    <div className="mt-3 space-y-3">
                      {col.groups.map((group) => (
                        <div key={group.title}>
                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
                            {group.title}
                          </p>
                          <ul className="flex flex-wrap gap-1.5">
                            {group.items.map((leaf) => (
                              <li key={leaf.label}>
                                <button
                                  onClick={() => goLeaf(leaf)}
                                  className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                                    isRealLeaf(leaf)
                                      ? "border-border/70 bg-background text-foreground/80 hover:border-copper/60 hover:bg-copper/10 hover:text-copper"
                                      : "border-dashed border-border/50 bg-transparent text-muted-foreground/60"
                                  }`}
                                >
                                  {leaf.label}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => { closeMobileMenu(); router.push("/productos"); }}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-copper transition-[gap,transform] duration-300 hover:gap-2"
                >
                  Ver catálogo completo
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
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
                  onClick={() => { closeMobileMenu(); router.push("/marcas"); }}
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
                onClick={closeMobileMenu}
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
          className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[400px]"
        >
          <div className="shrink-0 border-b border-border px-5 pb-4 pt-6 pr-12">
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="font-display text-xl font-semibold tracking-tight">
                Tu carrito
              </SheetTitle>
              <SheetDescription className="text-xs">
                {quoteRows.length === 0
                  ? "Aún no agregas productos."
                  : `${quoteRows.length} producto${quoteRows.length === 1 ? "" : "s"}`}
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
            {quoteRows.length === 0 ? (
              <div className="grid place-items-center rounded-xl border border-dashed border-border py-16 text-center">
                <ShoppingBag className="h-7 w-7 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">Tu carrito está vacío</p>
                <button
                  type="button"
                  onClick={() => {
                    setQuoteOpen(false);
                    router.push("/productos");
                  }}
                  className="mt-4 text-sm font-medium text-copper hover:underline"
                >
                  Explorar catálogo
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-border/80">
                {quoteRows.map(({ p, qty }) => (
                  <li key={p.id} className="flex gap-3 py-3">
                    <Link
                      href={`/productos/${p.slug}`}
                      onClick={() => setQuoteOpen(false)}
                      className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted"
                    >
                      {p.image && (
                        <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                      )}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/productos/${p.slug}`}
                          onClick={() => setQuoteOpen(false)}
                          className="min-w-0"
                        >
                          {p.brand && (
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-copper">
                              {p.brand}
                            </p>
                          )}
                          <p className="line-clamp-2 text-[13px] font-medium leading-snug">{p.name}</p>
                        </Link>
                        <button
                          aria-label="Quitar"
                          onClick={() => removeQuote(p.id)}
                          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <QuantityStepper
                          value={qty}
                          size="sm"
                          onChange={(next) => setQuoteQty(p.id, next)}
                        />
                        <span className="text-sm font-semibold tabular-nums">
                          {formatPrice(p.price * qty)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {quoteRows.length > 0 && (
            <div className="shrink-0 border-t border-border bg-background px-5 py-4">
              <p className={cn(siteShell.labelCaps, "mt-0.5")}>Total estimado</p>
              <p className={cn(typography.priceTotal, "mt-0.5")}>{formatPrice(quoteTotal)}</p>

              <div className="mt-4 space-y-2">
                {account?.isAdmin ? (
                  <CartShareActions lines={shareLines} variant="primary" compact />
                ) : (
                  <a
                    href={quoteWhatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setQuoteOpen(false)}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-copper text-sm font-semibold text-copper-foreground transition-colors hover:bg-copper/90"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Solicitar asesoría
                  </a>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    setQuoteOpen(false);
                    router.push("/carrito");
                  }}
                  className="h-10 w-full rounded-full text-sm"
                >
                  Ver carrito
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setQuoteOpen(false);
                    router.push("/productos");
                  }}
                  className="w-full py-1.5 text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
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
        <SheetContent side="right" className="bg-background w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle className="font-display text-2xl font-medium tracking-tight">
              Tus favoritos
            </SheetTitle>
            <SheetDescription>
              {favProducts.length === 0
                ? "Aún no has guardado productos."
                : `${favProducts.length} producto${favProducts.length === 1 ? "" : "s"} guardado${favProducts.length === 1 ? "" : "s"}.`}
            </SheetDescription>
          </SheetHeader>

          {favProducts.length === 0 ? (
            <div className="mt-8 grid place-items-center rounded-xl border border-dashed border-border py-14 text-center">
              <Heart className="h-8 w-8 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                Toca el corazón en cualquier producto para guardarlo aquí.
              </p>
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-border">
              {favProducts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <Link
                    href={`/productos/${p.slug}`}
                    onClick={() => setFavOpen(false)}
                    className="flex flex-1 items-center gap-3"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {p.brand}
                      </p>
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{formatPrice(p.price)}</p>
                    </div>
                  </Link>
                  <button
                    aria-label="Quitar"
                    onClick={() => removeFav(p.id)}
                    className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex flex-col gap-2">
            <Button
              onClick={() => {
                setFavOpen(false);
                router.push("/favoritos");
              }}
              className="h-11"
            >
              Ver panel completo
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFavOpen(false);
                router.push("/productos");
              }}
              className="h-11"
            >
              Seguir explorando
            </Button>
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
  const FAV_BRANDS = ["Fender", "Yamaha", "Shure", "Roland", "Pearl"];

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
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca instrumentos, marcas, accesorios…"
            className="w-full bg-transparent font-display text-xl font-light tracking-tight text-foreground placeholder:text-muted-foreground/60 focus:outline-none md:text-2xl"
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
                {FAV_BRANDS.map((b) => (
                  <button
                    key={b}
                    onClick={() => onPickBrand(b)}
                    className="rounded-full border border-border px-3.5 py-1.5 text-xs uppercase tracking-[0.12em] text-foreground/80 transition-colors hover:border-copper hover:text-copper"
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
                      <span className="hidden font-mono text-xs text-foreground/80 sm:inline">
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
