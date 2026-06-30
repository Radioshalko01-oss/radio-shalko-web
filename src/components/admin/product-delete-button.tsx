"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { deleteProduct } from "@/lib/admin/product-actions";
import { AdminButton } from "@/components/admin/admin-button";
import { adminShell } from "@/lib/design/admin-shell";
import { cn } from "@/lib/utils";

type Variant = "icon" | "button";

export function ProductDeleteButton({
  id,
  name,
  variant = "icon",
  redirectTo,
}: {
  id: string;
  name: string;
  variant?: Variant;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending]);

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteProduct(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      if (redirectTo) {
        router.push(redirectTo);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Eliminar producto"
          title="Eliminar producto"
          className="grid h-[30px] w-[30px] place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : (
        <AdminButton type="button" onClick={() => setOpen(true)} variant="danger">
          <Trash2 className="h-4 w-4" />
          Eliminar producto
        </AdminButton>
      )}

      {open && (
        <div className={cn(adminShell.modalOverlay, "z-[100] items-center")}>
          <div
            className={cn(adminShell.modalPanel, "max-w-md p-6")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground">
                  ¿Deseas eliminar este producto?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground/90">{name}</span> se eliminará para
                  siempre. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
              <AdminButton
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                variant="secondary"
              >
                Cancelar
              </AdminButton>
              <AdminButton
                type="button"
                onClick={confirm}
                disabled={pending}
                variant="dangerSolid"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Eliminar definitivamente
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
