"use client";

/**
 * QuoteProvider · Fase 4 / 4.1 (cotización como carrito inteligente).
 *
 * Fuente única de verdad para la cotización en el sitio público. Mantiene la
 * API previa ({ ids, has, toggle, remove, count }) y añade cantidades
 * ({ items, getQuantity, setQuantity }) sin tocar a los consumidores antiguos.
 *
 *   - Invitado (sin sesión)  → localStorage (con cantidades), sync entre pestañas.
 *   - Con sesión             → Supabase (quote_items.quantity) vía Server Actions.
 *     Al montar fusiona la cotización local previa (una vez) y limpia localStorage.
 *     Mutaciones optimistas con reversión ante error.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addQuoteItem,
  clearQuoteCart,
  removeQuoteItem,
  setQuoteItemQuantity,
  syncQuote,
  type QuoteItemDTO,
} from "@/lib/quotes/actions";

const KEY = "shalko:quote";
const EVT = "shalko:quote-changed";

export type QuoteItem = QuoteItemDTO;

export type QuoteContextValue = {
  items: QuoteItem[];
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  getQuantity: (id: string) => number;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => Promise<void>;
  count: number;
};

const QuoteContext = createContext<QuoteContextValue | null>(null);

function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  const n = Math.floor(value);
  return n < 1 ? 1 : n;
}

/** Lee localStorage soportando el formato heredado (string[]) y el nuevo. */
function readLocal(): QuoteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const items: QuoteItem[] = [];
    const seen = new Set<string>();
    for (const entry of parsed) {
      let productId: string | undefined;
      let quantity = 1;
      if (typeof entry === "string") {
        productId = entry;
      } else if (entry && typeof entry === "object") {
        const o = entry as Record<string, unknown>;
        productId = (o.id ?? o.productId) as string | undefined;
        quantity = clampQuantity(Number(o.q ?? o.quantity ?? 1));
      }
      if (!productId || seen.has(productId)) continue;
      seen.add(productId);
      items.push({ productId, quantity });
    }
    return items;
  } catch {
    return [];
  }
}

function writeLocal(items: QuoteItem[]) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify(items.map((i) => ({ id: i.productId, q: i.quantity }))),
    );
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {}
}

function clearLocal() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {}
}

export function QuoteProvider({
  isAuthed,
  initialItems,
  children,
}: {
  isAuthed: boolean;
  initialItems: QuoteItem[];
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<QuoteItem[]>(initialItems);
  const itemsRef = useRef<QuoteItem[]>(initialItems);

  const apply = useCallback((next: QuoteItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  useEffect(() => {
    if (isAuthed) {
      const local = readLocal();
      if (local.length) {
        syncQuote(local)
          .then((merged) => {
            apply(merged);
            clearLocal();
          })
          .catch(() => apply(initialItems));
      } else {
        apply(initialItems);
      }
      return;
    }

    apply(readLocal());
    const onChange = () => apply(readLocal());
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  const ids = useMemo(() => items.map((i) => i.productId), [items]);

  const has = useCallback(
    (id: string) => itemsRef.current.some((i) => i.productId === id),
    // recalcula con cada render (items en deps) para reflejar el estado
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items],
  );

  const getQuantity = useCallback(
    (id: string) => itemsRef.current.find((i) => i.productId === id)?.quantity ?? 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items],
  );

  const toggle = useCallback(
    (id: string) => {
      const exists = itemsRef.current.some((i) => i.productId === id);
      const next = exists
        ? itemsRef.current.filter((i) => i.productId !== id)
        : [...itemsRef.current, { productId: id, quantity: 1 }];
      apply(next);

      if (isAuthed) {
        const action = exists ? removeQuoteItem(id) : addQuoteItem(id);
        action
          .then((res) => {
            if (!res.ok) apply(itemsRef.current); // recarga visual; estado servidor manda
          })
          .catch(() => apply(itemsRef.current));
      } else {
        writeLocal(next);
      }
    },
    [apply, isAuthed],
  );

  const remove = useCallback(
    (id: string) => {
      if (!itemsRef.current.some((i) => i.productId === id)) return;
      const next = itemsRef.current.filter((i) => i.productId !== id);
      apply(next);

      if (isAuthed) {
        removeQuoteItem(id).catch(() => {});
      } else {
        writeLocal(next);
      }
    },
    [apply, isAuthed],
  );

  const setQuantity = useCallback(
    (id: string, quantity: number) => {
      const q = clampQuantity(quantity);
      const exists = itemsRef.current.some((i) => i.productId === id);
      const next = exists
        ? itemsRef.current.map((i) =>
            i.productId === id ? { ...i, quantity: q } : i,
          )
        : [...itemsRef.current, { productId: id, quantity: q }];
      apply(next);

      if (isAuthed) {
        setQuoteItemQuantity(id, q).catch(() => {});
      } else {
        writeLocal(next);
      }
    },
    [apply, isAuthed],
  );

  const clearCart = useCallback(async () => {
    apply([]);
    if (isAuthed) {
      await clearQuoteCart();
    } else {
      clearLocal();
    }
  }, [apply, isAuthed]);

  const value: QuoteContextValue = {
    items,
    ids,
    has,
    toggle,
    remove,
    getQuantity,
    setQuantity,
    clearCart,
    count: items.length,
  };

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuoteContext(): QuoteContextValue {
  const ctx = useContext(QuoteContext);
  if (!ctx) {
    throw new Error("useQuote debe usarse dentro de <QuoteProvider>.");
  }
  return ctx;
}
