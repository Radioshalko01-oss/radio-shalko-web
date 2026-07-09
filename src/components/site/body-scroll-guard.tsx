"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Evita scroll/touch bloqueados si un overlay dejó `overflow: hidden` en el body. */
export function BodyScrollGuard() {
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    document.body.removeAttribute("data-scroll-locked");
  }, [pathname]);

  return null;
}
