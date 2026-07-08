"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { readCompositorStable, STABLE_COMPOSITOR_MQ } from "@/lib/motion/stable-viewport";

/**
 * Desactiva animaciones Framer Motion en tablet/touch.
 * Complementa prefers-reduced-motion para evitar rayas en Android WebKit.
 */
export function useStableMotion(): boolean {
  const prefersReducedMotion = useReducedMotion();
  const [isStableViewport, setIsStableViewport] = useState(readCompositorStable);

  useEffect(() => {
    const mq = window.matchMedia(STABLE_COMPOSITOR_MQ);
    const sync = () => setIsStableViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return Boolean(prefersReducedMotion || isStableViewport);
}
