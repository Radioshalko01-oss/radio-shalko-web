import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

const SUPABASE_STORAGE = "supabase.co/storage/v1/object/public";

type CatalogImageProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
} & (
  | { fill: true; width?: never; height?: never }
  | { fill?: false; width: number; height: number }
);

function canOptimize(src: string): boolean {
  return src.startsWith("/") || src.includes(SUPABASE_STORAGE);
}

/** Imagen de producto/catálogo con optimización automática (WebP/AVIF, tamaños). */
export function CatalogImage({
  src,
  alt,
  className,
  priority = false,
  sizes,
  fill,
  width,
  height,
}: CatalogImageProps) {
  if (!src) return null;

  if (!canOptimize(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL externa sin patrón configurado
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={className}
      />
    );
  }

  // Supabase Storage: URL directa (evita fallos del optimizador en dev/preview).
  if (src.includes(SUPABASE_STORAGE)) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={cn("absolute inset-0 h-full w-full", className)}
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={className}
      />
    );
  }

  const shared: Pick<ImageProps, "src" | "alt" | "className" | "priority" | "sizes"> = {
    src,
    alt,
    className: cn(className),
    priority,
    sizes:
      sizes ??
      (fill
        ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        : "(max-width: 768px) 100vw, 50vw"),
  };

  if (fill) {
    return <Image {...shared} fill />;
  }

  return <Image {...shared} width={width} height={height} />;
}
