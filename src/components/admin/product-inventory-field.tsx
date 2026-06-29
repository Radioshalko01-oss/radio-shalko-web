"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Warehouse } from "lucide-react";
import { updateProductInventory } from "@/lib/admin/product-actions";
import type { CatalogBranch, CatalogInventory } from "@/lib/catalog/types";

type Status = "idle" | "saving" | "success" | "error";

/** Convierte el valor del input a entero. "" → 0. null si es inválido. */
function parseQuantity(raw: string): number | null {
  const v = raw.trim();
  if (v === "") return 0;
  if (!/^\d+$/.test(v)) return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

export function ProductInventoryField({
  productId,
  branches,
  inventory,
}: {
  productId: string;
  branches: CatalogBranch[];
  inventory: CatalogInventory[];
}) {
  const router = useRouter();

  // Cantidad actual por sucursal (desde product.inventory; default 0).
  const initial = useMemo(() => {
    const byBranch = new Map(inventory.map((i) => [i.branch.id, i.quantity]));
    const map: Record<string, string> = {};
    for (const b of branches) map[b.id] = String(byBranch.get(b.id) ?? 0);
    return map;
  }, [branches, inventory]);

  const [quantities, setQuantities] = useState<Record<string, string>>(initial);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const busy = status === "saving";

  function handleChange(branchId: string, value: string) {
    setStatus("idle");
    setMessage(null);
    setQuantities((prev) => ({ ...prev, [branchId]: value }));
    setFieldErrors((prev) => {
      if (!prev[branchId]) return prev;
      const next = { ...prev };
      delete next[branchId];
      return next;
    });
  }

  async function handleSave() {
    setMessage(null);

    const items: Array<{ branchId: string; quantity: number }> = [];
    const errors: Record<string, string> = {};

    for (const b of branches) {
      const parsed = parseQuantity(quantities[b.id] ?? "");
      if (parsed === null) {
        errors[b.id] = "Debe ser un entero ≥ 0.";
        continue;
      }
      items.push({ branchId: b.id, quantity: parsed });
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStatus("error");
      setMessage("Revisa las cantidades marcadas.");
      return;
    }

    setFieldErrors({});
    setStatus("saving");
    const res = await updateProductInventory(productId, items);
    if (!res.ok) {
      setStatus("error");
      setMessage(res.error);
      return;
    }

    setStatus("success");
    setMessage("Inventario actualizado.");
    router.refresh();
  }

  if (branches.length === 0) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-900">
          Inventario por sucursal
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          No hay sucursales activas configuradas.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center gap-2">
        <Warehouse className="h-4 w-4 text-zinc-400" />
        <h2 className="text-sm font-semibold text-zinc-900">
          Inventario por sucursal
        </h2>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Existencias disponibles en cada sucursal. Cantidad entera mayor o igual a
        cero.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {branches.map((b) => {
          const err = fieldErrors[b.id];
          return (
            <div key={b.id}>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                {b.displayName || b.name}
              </label>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={quantities[b.id] ?? ""}
                onChange={(e) => handleChange(b.id, e.target.value)}
                disabled={busy}
                className={`h-9 w-full rounded-lg border bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 disabled:opacity-50 ${
                  err
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-zinc-200 focus:border-zinc-400 focus:ring-zinc-100"
                }`}
              />
              {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-3.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy ? "Guardando…" : "Guardar inventario"}
        </button>
        {message && (
          <span
            className={`text-xs ${
              status === "error" ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {message}
          </span>
        )}
      </div>
    </section>
  );
}
