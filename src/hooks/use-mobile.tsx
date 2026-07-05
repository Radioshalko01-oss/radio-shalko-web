import { useIsBelowMd } from "@/hooks/use-media-query";

/** Viewport narrower than Tailwind `md` (768px). */
export function useIsMobile() {
  return useIsBelowMd();
}
