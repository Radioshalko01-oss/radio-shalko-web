"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuote } from "@/hooks/use-quote";
import { fetchProductsByIds } from "@/lib/catalog/actions";
import type { CatalogProduct } from "@/lib/catalog/types";

export type CartProductRow = {
  product: CatalogProduct;
  quantity: number;
  subtotal: number;
};

/** Líneas del carrito con datos de catálogo (QuoteProvider). */
export function useCartProducts() {
  const { ids, getQuantity } = useQuote();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ids.length) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    fetchProductsByIds(ids)
      .then((res) => {
        if (active) {
          setProducts(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ids]);

  const rows = useMemo((): CartProductRow[] => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return ids
      .map((id) => byId.get(id))
      .filter((p): p is CatalogProduct => Boolean(p))
      .map((p) => {
        const quantity = getQuantity(p.id) || 1;
        return { product: p, quantity, subtotal: p.price * quantity };
      });
  }, [ids, products, getQuantity]);

  const subtotal = rows.reduce((acc, r) => acc + r.subtotal, 0);
  const count = rows.length;
  const units = rows.reduce((acc, r) => acc + r.quantity, 0);

  return { rows, loading, ids, count, units, subtotal, isEmpty: count === 0 };
}
