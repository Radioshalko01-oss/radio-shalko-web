"use client";

import { useLayoutEffect } from "react";
import { STABLE_COMPOSITOR_MQ } from "@/lib/motion/stable-viewport";

/** Marca `<html>` para reglas CSS de composición estable en tablet/touch. */
export function TouchStableRoot({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    const mq = window.matchMedia(STABLE_COMPOSITOR_MQ);
    const root = document.documentElement;

    const sync = () => {
      root.classList.toggle("compositor-stable", mq.matches);
      root.dataset.touchStable = mq.matches ? "true" : "false";
    };

    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      root.classList.remove("compositor-stable");
      delete root.dataset.touchStable;
    };
  }, []);

  return children;
}
