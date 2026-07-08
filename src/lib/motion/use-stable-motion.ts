"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Viewports tablet/móvil anchos donde WebKit suele mostrar artefactos de composición. */
const TABLET_MQ = "(max-width: 1023px)";

function readTabletViewport(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia(TABLET_MQ).matches;
}

/**
 * Desactiva animaciones que usan transform/opacity en tablet.
 * Complementa prefers-reduced-motion para evitar rayas / “pantalla de TV” en Android.
 */
export function useStableMotion(): boolean {
  const prefersReducedMotion = useReducedMotion();
  const [isTabletViewport, setIsTabletViewport] = useState(readTabletViewport);

  useEffect(() => {
    const mq = window.matchMedia(TABLET_MQ);
    const sync = () => setIsTabletViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return Boolean(prefersReducedMotion || isTabletViewport);
}
