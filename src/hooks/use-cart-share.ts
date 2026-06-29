"use client";

import { useCallback, useMemo, useState } from "react";
import { createSharedCart } from "@/lib/shared-cart/actions";
import {
  buildSimpleShareWhatsAppMessage,
  cartLinesToSharedInput,
  type SharedCartLineInput,
} from "@/lib/shared-cart/messages";

export function useCartShare(lines: SharedCartLineInput[]) {
  const fingerprint = useMemo(
    () => lines.map((l) => `${l.productId}:${l.quantity}`).join("|"),
    [lines],
  );

  const [shareMeta, setShareMeta] = useState<{
    url: string;
    fingerprint: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  const ensureShareUrl = useCallback(async (): Promise<string | null> => {
    if (!lines.length) return null;
    if (shareMeta?.fingerprint === fingerprint) {
      return shareMeta.url;
    }

    setLoading(true);
    try {
      const res = await createSharedCart({ lines: cartLinesToSharedInput(lines) });
      if (res.ok) {
        setShareMeta({ url: res.url, fingerprint });
        return res.url;
      }
    } finally {
      setLoading(false);
    }
    return null;
  }, [lines, fingerprint, shareMeta]);

  const shareCart = useCallback(async () => {
    const url = await ensureShareUrl();
    if (!url) return;
    const message = buildSimpleShareWhatsAppMessage(url);
    try {
      await navigator.clipboard.writeText(message);
      showToast("Mensaje copiado al portapapeles.");
    } catch {
      showToast("No se pudo copiar el mensaje.");
    }
  }, [ensureShareUrl, showToast]);

  return {
    loading,
    toast,
    shareUrl: shareMeta?.fingerprint === fingerprint ? shareMeta.url : null,
    shareCart,
  };
}
