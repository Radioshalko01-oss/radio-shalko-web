"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { CatalogProduct } from "@/lib/catalog/types";
import { fetchProductsByIds } from "@/lib/catalog/actions";

const KEY = "shalko:compare";
const EVT = "shalko:compare-changed";
export const COMPARE_MAX = 2;

export type CompareContextValue = {
  ids: string[];
  products: CatalogProduct[];
  loading: boolean;
  count: number;
  has: (id: string) => boolean;
  add: (id: string) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  modalOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  openModal: () => void;
  closeModal: () => void;
  startCompare: (id: string) => void;
};

const CompareContext = createContext<CompareContextValue | null>(null);

function readLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, COMPARE_MAX) : [];
  } catch {
    return [];
  }
}

function writeLocal(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids.slice(0, COMPARE_MAX)));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {}
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const idsRef = useRef<string[]>([]);
  const fetchGen = useRef(0);

  const applyIds = useCallback((next: string[]) => {
    const trimmed = next.slice(0, COMPARE_MAX);
    idsRef.current = trimmed;
    setIds(trimmed);
    writeLocal(trimmed);
  }, []);

  useEffect(() => {
    applyIds(readLocal());
    const onChange = () => applyIds(readLocal());
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [applyIds]);

  useEffect(() => {
    if (!ids.length) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const gen = ++fetchGen.current;
    setLoading(true);
    fetchProductsByIds(ids)
      .then((rows) => {
        if (gen !== fetchGen.current) return;
        const byId = new Map(rows.map((p) => [p.id, p]));
        setProducts(ids.map((id) => byId.get(id)).filter(Boolean) as CatalogProduct[]);
      })
      .catch(() => {
        if (gen !== fetchGen.current) return;
        setProducts([]);
      })
      .finally(() => {
        if (gen === fetchGen.current) setLoading(false);
      });
  }, [ids]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const add = useCallback(
    (id: string) => {
      if (idsRef.current.includes(id)) return true;
      if (idsRef.current.length >= COMPARE_MAX) return false;
      applyIds([...idsRef.current, id]);
      return true;
    },
    [applyIds],
  );

  const remove = useCallback(
    (id: string) => {
      applyIds(idsRef.current.filter((x) => x !== id));
    },
    [applyIds],
  );

  const clear = useCallback(() => {
    applyIds([]);
    setModalOpen(false);
  }, [applyIds]);

  const startCompare = useCallback(
    (id: string) => {
      const added = add(id);
      if (added) setDrawerOpen(true);
    },
    [add],
  );

  return (
    <CompareContext.Provider
      value={{
        ids,
        products,
        loading,
        count: ids.length,
        has,
        add,
        remove,
        clear,
        drawerOpen,
        modalOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
        openModal: () => setModalOpen(true),
        closeModal: () => setModalOpen(false),
        startCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompareContext(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error("useCompare debe usarse dentro de <CompareProvider>.");
  }
  return ctx;
}
