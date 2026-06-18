"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, Menu, X, ChevronDown, ArrowUpRight, Clock, Heart, Trash2 } from "lucide-react";
import { whatsappHref } from "@/lib/site-contact";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BRANDS, CATEGORY_TREE, PRODUCTS, formatPrice } from "@/lib/products";
import { useFavorites } from "@/hooks/use-favorites";
import { useQuote } from "@/hooks/use-quote";
const LOGO_SRC = "/images/logo-radio-shalko.svg";

const MEGA_ITEM =
  "text-left transition-[color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-0.5 hover:text-foreground focus-visible:translate-x-0.5 focus-visible:text-foreground focus-visible:outline-none";

const MEGA_HEADING =
  "mb-4 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-copper transition-[color,transform,gap] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-0.5 hover:text-foreground focus-visible:translate-x-0.5 focus-visible:text-foreground focus-visible:outline-none";

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

const FEATURED_BRANDS_HOME = ["Fender", "Gibson", "Yamaha", "Roland", "Shure", "Pearl"];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"productos" | "marcas" | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [megaPanel, setMegaPanel] = useState<"productos" | "marcas" | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const { ids: favIds, remove: removeFav, count: favCount } = useFavorites();
  const { ids: quoteIds, remove: removeQuote, count: quoteCount } = useQuote();
  const favProducts = useMemo(() => PRODUCTS.filter((p) => favIds.includes(p.id)), [favIds]);
  const quoteProducts = useMemo(() => PRODUCTS.filter((p) => quoteIds.includes(p.id)), [quoteIds]);

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

  // Group brands by letter ranges similar to Veerkamp
  const sortedBrands = [...BRANDS].sort((a, b) => a.localeCompare(b));
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

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        headerSolid
          ? "border-b border-border/60 bg-background/95 backdrop-blur-xl"
          : "bg-transparent"
      }`}
      onMouseLeave={scheduleClose}
    >
      <div className="relative mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-2 pl-0 pr-5 md:h-20 md:gap-4 md:pl-0 md:pr-8">
        <Link
          href="/"
          className="group ml-2 flex items-center md:-ml-8 lg:-ml-16"
          aria-label="Radio Shalko · Make noise, make history"
        >
          <img
            src={LOGO_SRC}
            alt="Radio Shalko"
            className="h-16 w-auto shrink-0 translate-y-1 object-contain transition-transform duration-500 group-hover:scale-[1.03] md:h-24 md:translate-y-1.5"
          />
        </Link>

        <nav className="hidden min-w-0 justify-center md:flex">
          <div className="flex items-center gap-7 lg:gap-9">
            {NAV.map((item) => (
              <div
                key={item.label}
                onMouseEnter={() => (item.panel ? openPanel(item.panel) : scheduleClose())}
                className="py-5"
              >
                <Link
                  href={item.to}
                  onClick={() => setMegaPanel(null)}
                  className="group relative text-[12px] font-normal uppercase tracking-[0.2em] text-foreground transition-colors hover:text-foreground/80"
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-1.5 left-0 h-px bg-copper transition-all duration-300 ${
                      megaPanel === item.panel && item.panel ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              </div>
            ))}
          </div>
        </nav>

        <div className="flex items-center justify-end gap-1.5">
          <button
            aria-label="Buscar"
            onClick={() => setSearchOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
          <button
            aria-label="Favoritos"
            onClick={() => setFavOpen(true)}
            className="relative grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
          >
            <Heart className="h-[18px] w-[18px]" />
            {favCount > 0 && (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-copper px-1 text-[10px] font-semibold text-copper-foreground">
                {favCount}
              </span>
            )}
          </button>
          <button
            aria-label="Cotización"
            onClick={() => setQuoteOpen(true)}
            className="relative grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {quoteCount > 0 && (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-copper px-1 text-[10px] font-semibold text-copper-foreground">
                {quoteCount}
              </span>
            )}
          </button>
          <button
            aria-label="Menú"
            onClick={toggleMobileMenu}
            className="grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition-colors hover:bg-muted md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mega panel */}
      <div
        onMouseEnter={() => megaPanel && openPanel(megaPanel)}
        onMouseLeave={scheduleClose}
        className={`hidden overflow-hidden border-t border-border/60 bg-background/98 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.14)] backdrop-blur-xl transition-[max-height,opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:block ${
          megaPanel
            ? "max-h-[640px] translate-y-0 opacity-100"
            : "pointer-events-none max-h-0 -translate-y-1 opacity-0"
        }`}
      >
        {megaPanel === "productos" && (
          <div className="mx-auto grid max-w-7xl grid-cols-12 gap-10 px-8 py-10 animate-in fade-in slide-in-from-top-1 duration-500">
            {(Object.keys(CATEGORY_TREE) as Array<keyof typeof CATEGORY_TREE>).map((cat) => (
              <div key={cat} className="col-span-3">
                <button
                  onClick={() => goCategoryGroup(cat)}
                  className={MEGA_HEADING}
                >
                  {cat} →
                </button>
                <ul className="space-y-2.5">
                  {CATEGORY_TREE[cat].map((sub) => (
                    <li key={sub}>
                      <button
                        onClick={() => goSubcategory(sub)}
                        className={`block w-full text-sm text-foreground/80 ${MEGA_ITEM}`}
                      >
                        {sub}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="col-span-3 rounded-2xl border border-border/60 bg-gradient-to-br from-muted/50 via-background to-transparent p-6 transition-[border-color,box-shadow,transform] duration-500 hover:border-copper/25 hover:shadow-[0_16px_32px_-18px_rgba(0,0,0,0.18)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Destacado
              </p>
              <p className="mt-3 font-display text-2xl font-light leading-tight">
                Novedades de temporada
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Lo más nuevo en cuerdas, percusiones y audio profesional.
              </p>
              <button
                onClick={() => {
                  setMegaPanel(null);
                  router.push("/productos");
                }}
                className={`mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 ${MEGA_ITEM}`}
              >
                Ver catálogo completo →
              </button>
            </div>
          </div>
        )}

        {megaPanel === "marcas" && (
          <div className="mx-auto grid max-w-7xl grid-cols-12 gap-8 px-8 py-10 animate-in fade-in slide-in-from-top-1 duration-500">
            {brandColumns.map((col) => (
              <div key={col.label} className="col-span-2">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-copper">
                  {col.label}
                </p>
                <ul className="space-y-2">
                  {col.items.map((b) => (
                    <li key={b}>
                      <button
                        onClick={() => goBrand(b)}
                        className={`block w-full text-sm uppercase tracking-wide text-foreground/80 ${MEGA_ITEM}`}
                      >
                        {b}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="col-span-2 rounded-2xl border border-border/60 bg-gradient-to-br from-muted/50 via-background to-transparent p-5 transition-[border-color,box-shadow] duration-500 hover:border-copper/25 hover:shadow-[0_16px_32px_-18px_rgba(0,0,0,0.18)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                Favoritas
              </p>
              <ul className="mt-3 space-y-1.5">
                {FEATURED_BRANDS_HOME.map((b) => (
                  <li key={b}>
                    <button
                      onClick={() => goBrand(b)}
                      className={`font-display text-base font-medium ${MEGA_ITEM}`}
                    >
                      {b}
                    </button>
                  </li>
                ))}
              </ul>
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
              <div className="space-y-5 pb-4 pt-2">
                {(Object.keys(CATEGORY_TREE) as Array<keyof typeof CATEGORY_TREE>).map((cat) => (
                  <div key={cat} className="rounded-xl border border-border/50 bg-card/60 p-3.5">
                    <button
                      onClick={() => goCategoryGroup(cat)}
                      className="group flex w-full items-center justify-between text-left"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-copper">
                        {cat}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-copper/70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {CATEGORY_TREE[cat].map((sub) => (
                        <li key={sub}>
                          <button
                            onClick={() => goSubcategory(sub)}
                            className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-[12px] text-foreground/80 transition-colors hover:border-copper/60 hover:bg-copper/10 hover:text-copper"
                          >
                            {sub}
                          </button>
                        </li>
                      ))}
                    </ul>
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
            onPickProduct={(term) => submitSearch(term)}
          />
        </SheetContent>
      </Sheet>

      {/* Quote / Cotización panel */}
      <Sheet open={quoteOpen} onOpenChange={setQuoteOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto bg-background sm:max-w-md">
          <SheetHeader className="text-left">
            <SheetTitle className="font-display text-2xl font-medium tracking-tight">
              Tu cotización
            </SheetTitle>
            <SheetDescription>
              {quoteProducts.length === 0
                ? "Aún no agregas productos. Toca Cotizar en cualquier producto."
                : `${quoteProducts.length} producto${quoteProducts.length === 1 ? "" : "s"} en tu lista.`}
            </SheetDescription>
          </SheetHeader>

          {quoteProducts.length === 0 ? (
            <div className="mt-8 grid place-items-center rounded-xl border border-dashed border-border py-14 text-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                Tu lista está vacía
              </p>
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-border">
              {quoteProducts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <Link
                    href={`/productos?sub=${encodeURIComponent(p.subcategory)}`}
                    onClick={() => setQuoteOpen(false)}
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
                    onClick={() => removeQuote(p.id)}
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
                setQuoteOpen(false);
                router.push("/cotizacion");
              }}
              disabled={quoteProducts.length === 0}
              className="h-11 bg-copper text-copper-foreground hover:bg-copper/90"
            >
              Ver cotización
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setQuoteOpen(false);
                router.push("/productos");
              }}
              className="h-11"
            >
              Seguir explorando
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setQuoteOpen(false);
                router.push("/contacto");
              }}
              className="h-11"
            >
              Solicitar asesoría
            </Button>
          </div>
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
                    href={`/productos?sub=${encodeURIComponent(p.subcategory)}`}
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
  query,
  setQuery,
  onSubmit,
  recent,
  clearRecent,
  onPickBrand,
  onPickSub,
  onPickProduct,
}: {
  query: string;
  setQuery: (v: string) => void;
  onSubmit: (q: string) => void;
  recent: string[];
  clearRecent: () => void;
  onPickBrand: (b: string) => void;
  onPickSub: (sub: string) => void;
  onPickProduct: (term: string) => void;
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
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.subcategory.toLowerCase().includes(q),
    ).slice(0, 5);
  }, [q, hasQuery]);

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
                        onClick={() => onPickProduct(r)}
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
                      onClick={() => onPickProduct(p.name)}
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
