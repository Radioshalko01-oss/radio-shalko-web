/**
 * Utilidades de stock · CART-4 (POS por sucursal).
 */
import { LOW_STOCK_THRESHOLD } from "@/lib/admin/inventory-constants";
import type { SellerProduct } from "@/lib/admin/seller-queries";
import type { CatalogBranch } from "@/lib/catalog/types";

export type StockLevel = "out" | "low" | "ok";

export function getStockLevel(qty: number): StockLevel {
  if (qty <= 0) return "out";
  if (qty <= LOW_STOCK_THRESHOLD) return "low";
  return "ok";
}

export const STOCK_LEVEL_STYLES: Record<
  StockLevel,
  { label: string; badge: string; dot: string }
> = {
  out: {
    label: "Sin stock",
    badge: "bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  low: {
    label: "Bajo stock",
    badge: "bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
  },
  ok: {
    label: "Disponible",
    badge: "bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
};

export function branchQty(product: SellerProduct, branchId: string): number {
  return product.byBranch[branchId] ?? 0;
}

/** Stock usado para filtros y estado principal (sucursal o total). */
export function scopeStock(product: SellerProduct, branchId: string): number {
  return branchId ? branchQty(product, branchId) : product.totalStock;
}

/** Sucursales con stock > 0 distintas a la seleccionada. */
export function otherBranchesWithStock(
  product: SellerProduct,
  branches: CatalogBranch[],
  selectedBranchId: string,
): { name: string; qty: number }[] {
  return branches
    .filter((b) => b.id !== selectedBranchId)
    .map((b) => ({ name: b.name, qty: branchQty(product, b.id) }))
    .filter((x) => x.qty > 0);
}

export function branchLabel(branch: CatalogBranch): string {
  return branch.name;
}
