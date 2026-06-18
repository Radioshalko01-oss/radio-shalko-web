import type { CatalogInventory } from "./types";

/** Suma de existencias en todas las sucursales. */
export function totalStock(inventory: CatalogInventory[]): number {
  return inventory.reduce((sum, i) => sum + (i.quantity ?? 0), 0);
}

/** ¿Hay al menos una unidad disponible en cualquier sucursal? */
export function isAvailable(inventory: CatalogInventory[]): boolean {
  return totalStock(inventory) > 0;
}

/** Existencias en una sucursal concreta (por slug). 0 si no hay fila. */
export function stockByBranch(
  inventory: CatalogInventory[],
  branchSlug: string,
): number {
  return inventory.find((i) => i.branch.slug === branchSlug)?.quantity ?? 0;
}
