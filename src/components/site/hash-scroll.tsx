"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function scrollToHash() {
  const hash = window.location.hash;
  if (!hash) return;

  const el = document.getElementById(hash.slice(1));
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function HashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const timer = window.setTimeout(scrollToHash, 120);
    window.addEventListener("hashchange", scrollToHash);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, [pathname]);

  return null;
}
