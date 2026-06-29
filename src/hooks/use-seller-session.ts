"use client";

import { useCallback, useEffect, useState } from "react";
import type { SellerProduct } from "@/lib/admin/seller-queries";
import {
  archiveSaleToHistory,
  createSaleSession,
  initSaleSession,
  loadSaleHistory,
  saveActiveSession,
  type PosCartLine,
  type PosSaleHistoryEntry,
  type PosSaleSession,
} from "@/lib/admin/seller-session";

function clampQty(n: number): number {
  if (!Number.isFinite(n)) return 1;
  const v = Math.floor(n);
  return v < 1 ? 1 : v;
}

function productToLine(p: SellerProduct, quantity: number): PosCartLine {
  return {
    productId: p.id,
    name: p.name,
    brandName: p.brandName,
    price: p.price,
    image: p.image,
    quantity: clampQty(quantity),
  };
}

export function useSellerSession(productsById: Map<string, SellerProduct>) {
  const [session, setSession] = useState<PosSaleSession | null>(null);
  const [history, setHistory] = useState<PosSaleHistoryEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  /** Venta recién finalizada (resumen para WhatsApp antes de nueva sesión). */
  const [completedLines, setCompletedLines] = useState<PosCartLine[] | null>(null);

  useEffect(() => {
    setSession(initSaleSession());
    setHistory(loadSaleHistory());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: PosSaleSession) => {
    setSession(next);
    saveActiveSession(next);
  }, []);

  const getQuantity = useCallback(
    (productId: string) =>
      session?.lines.find((l) => l.productId === productId)?.quantity ?? 0,
    [session],
  );

  const addProduct = useCallback(
    (productId: string) => {
      if (!session) return;
      const p = productsById.get(productId);
      if (!p) return;
      const existing = session.lines.find((l) => l.productId === productId);
      const nextLines = existing
        ? session.lines.map((l) =>
            l.productId === productId
              ? { ...l, quantity: clampQty(l.quantity + 1) }
              : l,
          )
        : [...session.lines, productToLine(p, 1)];
      persist({ ...session, lines: nextLines });
      setCompletedLines(null);
    },
    [session, productsById, persist],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (!session) return;
      const q = clampQty(quantity);
      const exists = session.lines.some((l) => l.productId === productId);
      const p = productsById.get(productId);
      if (!exists && !p) return;
      const nextLines = exists
        ? session.lines.map((l) =>
            l.productId === productId ? { ...l, quantity: q } : l,
          )
        : p
          ? [...session.lines, productToLine(p, q)]
          : session.lines;
      persist({ ...session, lines: nextLines });
      setCompletedLines(null);
    },
    [session, productsById, persist],
  );

  const removeLine = useCallback(
    (productId: string) => {
      if (!session) return;
      persist({
        ...session,
        lines: session.lines.filter((l) => l.productId !== productId),
      });
      setCompletedLines(null);
    },
    [session, persist],
  );

  const clearLines = useCallback(() => {
    if (!session) return;
    persist({ ...session, lines: [] });
    setCompletedLines(null);
  }, [session, persist]);

  const startNewSession = useCallback(() => {
    const next = createSaleSession();
    setSession(next);
    setCompletedLines(null);
    setHistory(loadSaleHistory());
    return next;
  }, []);

  const finalizeSale = useCallback(() => {
    if (!session || !session.lines.length) return null;
    const snapshot = [...session.lines];
    archiveSaleToHistory(session);
    setHistory(loadSaleHistory());
    persist({ ...session, lines: [] });
    setCompletedLines(snapshot);
    return snapshot;
  }, [session, persist]);

  const dismissCompleted = useCallback(() => {
    setCompletedLines(null);
    startNewSession();
  }, [startNewSession]);

  const activeLines = completedLines ?? session?.lines ?? [];

  return {
    hydrated,
    session,
    history,
    activeLines,
    completedLines,
    getQuantity,
    addProduct,
    setQuantity,
    removeLine,
    clearLines,
    startNewSession,
    finalizeSale,
    dismissCompleted,
  };
}
