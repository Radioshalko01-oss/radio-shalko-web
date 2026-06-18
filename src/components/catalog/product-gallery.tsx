"use client";

import { useState } from "react";
import type { CatalogImage } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

/**
 * Galería base de la PDP (Fase 1 · C3). Imagen principal + miniaturas.
 * Versión funcional, sin zoom/lightbox todavía (refinamiento visual posterior).
 */
export function ProductGallery({ images, name }: { images: CatalogImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const main = images[active] ?? images[0];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
        {main ? (
          <img
            src={main.url}
            alt={main.alt ?? name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">
            Sin imagen
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted transition-colors",
                i === active ? "border-foreground" : "border-border hover:border-foreground/40",
              )}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
