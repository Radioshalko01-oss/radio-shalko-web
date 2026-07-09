"use client";

import { useCompareContext } from "@/components/providers/compare-provider";

export function useCompare() {
  return useCompareContext();
}
