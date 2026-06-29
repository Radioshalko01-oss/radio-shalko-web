"use client";

/**
 * FavoritesProvider · Fase 3 (favoritos persistentes).
 *
 * Fuente única de verdad para favoritos en todo el sitio público. Mantiene la
 * misma API que el hook original ({ ids, has, toggle, remove, count }) para no
 * tocar ningún consumidor (ProductCard, header, página de favoritos…).
 *
 * Comportamiento:
 *   - Invitado (sin sesión)  → localStorage (igual que antes), con sync entre
 *     pestañas.
 *   - Con sesión             → Supabase vía Server Actions. Al montar, fusiona
 *     los favoritos locales previos hacia Supabase (una sola vez) y limpia el
 *     localStorage. Las mutaciones son optimistas con reversión ante error.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  addFavorite,
  removeFavorite,
  syncFavorites,
} from "@/lib/favorites/actions";

const KEY = "shalko:favorites";
const EVT = "shalko:favorites-changed";

export type FavoritesContextValue = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  count: number;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function readLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {}
}

function clearLocal() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {}
}

export function FavoritesProvider({
  isAuthed,
  initialIds,
  children,
}: {
  isAuthed: boolean;
  initialIds: string[];
  children: React.ReactNode;
}) {
  const [ids, setIds] = useState<string[]>(initialIds);
  const idsRef = useRef<string[]>(initialIds);

  const apply = useCallback((next: string[]) => {
    idsRef.current = next;
    setIds(next);
  }, []);

  // Inicialización según modo (invitado vs sesión).
  useEffect(() => {
    if (isAuthed) {
      const local = readLocal();
      if (local.length) {
        // Primer login con favoritos locales: fusiona y limpia localStorage.
        syncFavorites(local)
          .then((merged) => {
            apply(merged);
            clearLocal();
          })
          .catch(() => apply(initialIds));
      } else {
        apply(initialIds);
      }
      return;
    }

    // Invitado: localStorage + sincronización entre pestañas.
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

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback(
    (id: string) => {
      const exists = idsRef.current.includes(id);
      const next = exists
        ? idsRef.current.filter((x) => x !== id)
        : [...idsRef.current, id];
      apply(next);

      if (isAuthed) {
        const action = exists ? removeFavorite(id) : addFavorite(id);
        action
          .then((res) => {
            if (!res.ok) {
              // Revertir ante error sin pisar cambios posteriores del usuario.
              const cur = idsRef.current;
              apply(exists ? [...cur, id] : cur.filter((x) => x !== id));
            }
          })
          .catch(() => {
            const cur = idsRef.current;
            apply(exists ? [...cur, id] : cur.filter((x) => x !== id));
          });
      } else {
        writeLocal(next);
      }
    },
    [apply, isAuthed],
  );

  const remove = useCallback(
    (id: string) => {
      if (!idsRef.current.includes(id)) return;
      const next = idsRef.current.filter((x) => x !== id);
      apply(next);

      if (isAuthed) {
        removeFavorite(id)
          .then((res) => {
            if (!res.ok) apply([...idsRef.current, id]);
          })
          .catch(() => apply([...idsRef.current, id]));
      } else {
        writeLocal(next);
      }
    },
    [apply, isAuthed],
  );

  return (
    <FavoritesContext.Provider value={{ ids, has, toggle, remove, count: ids.length }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites debe usarse dentro de <FavoritesProvider>.");
  }
  return ctx;
}
