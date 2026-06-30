"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Warehouse } from "lucide-react";
import { updateProductInventory } from "@/lib/admin/product-actions";
import type { CatalogBranch, CatalogInventory } from "@/lib/catalog/types";
import { AdminButton } from "@/components/admin/admin-button";
import { AdminFieldGroup, adminInputClass } from "@/components/admin/admin-patterns";
import { adminShell } from "@/lib/design/admin-shell";
import { cn } from "@/lib/utils";

type Status = "idle" | "saving" | "success" | "error";

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
      <section className={cn(adminShell.cardSection, "p-6")}>
        <h2 className={adminShell.sectionTitleSm}>Inventario por sucursal</h2>
        <p className={adminShell.sectionDesc}>No hay sucursales activas configuradas.</p>
      </section>
    );
  }

  return (
    <section className={cn(adminShell.cardSection, "p-6")}>
      <div className="flex items-center gap-2">
        <Warehouse className="h-4 w-4 text-muted-foreground" />
        <h2 className={adminShell.sectionTitleSm}>Inventario por sucursal</h2>
      </div>
      <p className={adminShell.sectionDesc}>
        Existencias disponibles en cada sucursal. Cantidad entera mayor o igual a cero.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {branches.map((b) => {
          const err = fieldErrors[b.id];
          return (
            <AdminFieldGroup key={b.id} label={b.displayName || b.name} error={err ? [err] : undefined}>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={quantities[b.id] ?? ""}
                onChange={(e) => handleChange(b.id, e.target.value)}
                disabled={busy}
                className={adminInputClass(Boolean(err))}
              />
            </AdminFieldGroup>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <AdminButton type="button" onClick={handleSave} disabled={busy} variant="primary">
          {busy ? "Guardando…" : "Guardar inventario"}
        </AdminButton>
        {message && (
          <span
            className={cn(
              "text-xs",
              status === "error" ? "text-red-600" : "text-emerald-600",
            )}
          >
            {message}
          </span>
        )}
      </div>
    </section>
  );
}
