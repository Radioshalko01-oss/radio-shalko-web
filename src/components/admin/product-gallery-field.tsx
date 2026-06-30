"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { CatalogImage } from "@/lib/catalog/types";
import {
  MAX_GALLERY_IMAGES,
  uploadProductGalleryImage,
  validateMainImage,
} from "@/lib/admin/product-image-upload";
import {
  addProductImage,
  deleteProductImage,
  reorderProductImages,
  updateProductImageUrl,
} from "@/lib/admin/product-gallery-actions";
import { AdminButton } from "@/components/admin/admin-button";
import { adminShell } from "@/lib/design/admin-shell";
import { cn } from "@/lib/utils";

type Feedback = { type: "error" | "success"; text: string } | null;

export function ProductGalleryField({
  productId,
  productName,
  initialImages,
}: {
  productId: string;
  productName: string;
  initialImages: CatalogImage[];
}) {
  const router = useRouter();

  const [images, setImages] = useState<CatalogImage[]>(initialImages);
  const [pendingAdd, setPendingAdd] = useState<{ file: File; previewUrl: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // "add" | imageId | "reorder" | null
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const addInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetId = useRef<string | null>(null);

  // Mantener el estado sincronizado tras router.refresh().
  const sig = initialImages.map((i) => `${i.id}:${i.sortOrder}:${i.url}`).join("|");
  useEffect(() => {
    setImages(initialImages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const atLimit = images.length >= MAX_GALLERY_IMAGES;
  const isBusy = busy !== null;

  // --- Agregar ---

  function onPickAdd(e: React.ChangeEvent<HTMLInputElement>) {
    setFeedback(null);
    const file = e.target.files?.[0] ?? null;
    if (addInputRef.current) addInputRef.current.value = "";
    if (!file) return;
    const err = validateMainImage(file);
    if (err) {
      setFeedback({ type: "error", text: err });
      return;
    }
    if (pendingAdd) URL.revokeObjectURL(pendingAdd.previewUrl);
    setPendingAdd({ file, previewUrl: URL.createObjectURL(file) });
  }

  function cancelAdd() {
    if (pendingAdd) URL.revokeObjectURL(pendingAdd.previewUrl);
    setPendingAdd(null);
  }

  async function confirmAdd() {
    if (!pendingAdd) return;
    setFeedback(null);
    setBusy("add");
    const uploaded = await uploadProductGalleryImage(productId, pendingAdd.file);
    if (!uploaded.ok) {
      setBusy(null);
      setFeedback({ type: "error", text: uploaded.error });
      return;
    }
    const saved = await addProductImage(productId, {
      url: uploaded.url,
      alt: productName,
    });
    setBusy(null);
    if (!saved.ok) {
      setFeedback({ type: "error", text: saved.error });
      return;
    }
    cancelAdd();
    setFeedback({ type: "success", text: "Imagen agregada." });
    router.refresh();
  }

  // --- Reemplazar ---

  function triggerReplace(imageId: string) {
    replaceTargetId.current = imageId;
    replaceInputRef.current?.click();
  }

  async function onPickReplace(e: React.ChangeEvent<HTMLInputElement>) {
    setFeedback(null);
    const file = e.target.files?.[0] ?? null;
    const imageId = replaceTargetId.current;
    if (replaceInputRef.current) replaceInputRef.current.value = "";
    if (!file || !imageId) return;
    const err = validateMainImage(file);
    if (err) {
      setFeedback({ type: "error", text: err });
      return;
    }
    setBusy(imageId);
    const uploaded = await uploadProductGalleryImage(productId, file);
    if (!uploaded.ok) {
      setBusy(null);
      setFeedback({ type: "error", text: uploaded.error });
      return;
    }
    const saved = await updateProductImageUrl(productId, imageId, {
      url: uploaded.url,
      alt: productName,
    });
    setBusy(null);
    if (!saved.ok) {
      setFeedback({ type: "error", text: saved.error });
      return;
    }
    setFeedback({ type: "success", text: "Imagen reemplazada." });
    router.refresh();
  }

  // --- Reordenar / principal ---

  async function persistOrder(orderedIds: string[], busyKey: string) {
    setFeedback(null);
    setBusy(busyKey);
    const res = await reorderProductImages(productId, orderedIds);
    setBusy(null);
    if (!res.ok) {
      setFeedback({ type: "error", text: res.error });
      router.refresh();
      return;
    }
    router.refresh();
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next); // optimista
    persistOrder(next.map((i) => i.id), "reorder");
  }

  function makeMain(imageId: string) {
    if (images[0]?.id === imageId) return;
    const next = [
      ...images.filter((i) => i.id === imageId),
      ...images.filter((i) => i.id !== imageId),
    ];
    setImages(next); // optimista
    persistOrder(next.map((i) => i.id), imageId);
  }

  // --- Eliminar ---

  async function doDelete(imageId: string) {
    setConfirmDeleteId(null);
    setFeedback(null);
    setBusy(imageId);
    const res = await deleteProductImage(productId, imageId);
    setBusy(null);
    if (!res.ok) {
      setFeedback({ type: "error", text: res.error });
      return;
    }
    setFeedback({ type: "success", text: "Imagen eliminada." });
    router.refresh();
  }

  return (
    <section className={cn(adminShell.cardSection, "p-6")}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className={adminShell.sectionTitleSm}>Galería del producto</h2>
          <p className={adminShell.sectionDesc}>
            Hasta {MAX_GALLERY_IMAGES} imágenes. La primera es la principal. JPG, PNG o WEBP, máx. 5 MB.
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {images.length}/{MAX_GALLERY_IMAGES}
        </span>
      </div>

      {/* Inputs ocultos */}
      <input
        ref={addInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onPickAdd}
        className="hidden"
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onPickReplace}
        className="hidden"
      />

      {images.length === 0 && !pendingAdd ? (
        <button
          type="button"
          onClick={() => addInputRef.current?.click()}
          disabled={isBusy}
          className={cn(
            adminShell.emptyState,
            "mt-4 flex w-full flex-col items-center justify-center gap-2 border-solid py-12 transition-colors hover:border-copper/30",
          )}
        >
          <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
          <span className="text-sm font-medium text-foreground/85">Agregar imágenes</span>
          <span className="text-xs text-muted-foreground">Sube la primera imagen del producto.</span>
        </button>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img, index) => {
            const tileBusy = busy === img.id;
            const isMain = index === 0;
            return (
              <div
                key={img.id}
                className="group relative overflow-hidden rounded-xl border border-border bg-muted/30"
              >
                <div className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.alt ?? productName} className="h-full w-full object-cover" />

                  {isMain && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-foreground/90 px-2 py-0.5 text-[10px] font-semibold text-background">
                      <Star className="h-3 w-3 fill-current" />
                      Principal
                    </span>
                  )}

                  {tileBusy && (
                    <div className="absolute inset-0 grid place-items-center bg-white/70">
                      <Loader2 className="h-5 w-5 animate-spin text-zinc-700" />
                    </div>
                  )}

                  {confirmDeleteId === img.id && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900/80 p-3 text-center">
                      <p className="text-xs font-medium text-white">¿Eliminar imagen?</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => doDelete(img.id)}
                          className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-white"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Toolbar */}
                <div className={cn("flex items-center justify-between gap-1 border-t bg-card px-2 py-1.5", adminShell.dividerSoft)}>
                  <div className="flex items-center gap-0.5">
                    <IconBtn
                      label="Mover a la izquierda"
                      onClick={() => move(index, -1)}
                      disabled={isBusy || index === 0}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn
                      label="Mover a la derecha"
                      onClick={() => move(index, 1)}
                      disabled={isBusy || index === images.length - 1}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {!isMain && (
                      <IconBtn label="Marcar como principal" onClick={() => makeMain(img.id)} disabled={isBusy}>
                        <Star className="h-3.5 w-3.5" />
                      </IconBtn>
                    )}
                    <IconBtn label="Reemplazar" onClick={() => triggerReplace(img.id)} disabled={isBusy}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn
                      label="Eliminar"
                      onClick={() => setConfirmDeleteId(img.id)}
                      disabled={isBusy}
                      danger
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Tile pendiente (preview antes de subir) */}
          {pendingAdd && (
            <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50">
              <div className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pendingAdd.previewUrl} alt="Vista previa" className="h-full w-full object-cover opacity-90" />
                {busy === "add" && (
                  <div className="absolute inset-0 grid place-items-center bg-white/70">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-700" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 border-t border-zinc-200 bg-white px-2 py-1.5">
                <button
                  type="button"
                  onClick={confirmAdd}
                  disabled={busy === "add"}
                  className="inline-flex items-center gap-1 rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {busy === "add" ? "Subiendo…" : "Subir"}
                </button>
                <button
                  type="button"
                  onClick={cancelAdd}
                  disabled={busy === "add"}
                  className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Botón agregar (si no está al límite y no hay pendiente) */}
          {!pendingAdd && !atLimit && (
            <button
              type="button"
              onClick={() => addInputRef.current?.click()}
              disabled={isBusy}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-zinc-200 text-zinc-400 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-600 disabled:opacity-50"
            >
              <Plus className="h-6 w-6" />
              <span className="text-xs font-medium">Agregar</span>
            </button>
          )}
        </div>
      )}

      {atLimit && (
        <p className="mt-3 text-xs text-zinc-400">
          Alcanzaste el máximo de {MAX_GALLERY_IMAGES} imágenes. Elimina una para subir otra.
        </p>
      )}

      {feedback && (
        <p
          className={`mt-3 text-xs ${
            feedback.type === "error" ? "text-red-600" : "text-emerald-600"
          }`}
        >
          {feedback.text}
        </p>
      )}
    </section>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 disabled:opacity-30",
        danger ? "hover:bg-red-50 hover:text-red-600" : "hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
