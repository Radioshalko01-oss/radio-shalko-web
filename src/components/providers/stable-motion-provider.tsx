"use client";

import { MotionConfig } from "framer-motion";
import { useStableMotion } from "@/lib/motion/use-stable-motion";

/** Desactiva Framer Motion en tablet/móvil para evitar artefactos de composición en WebKit. */
export function StableMotionProvider({ children }: { children: React.ReactNode }) {
  const reduceMotion = useStableMotion();
  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>
      {children}
    </MotionConfig>
  );
}
