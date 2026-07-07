import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const PURCHASE_TRUST_LINKS = {
  compraSegura: { href: "/compra-segura", label: "Compra segura" },
  comoComprar: { href: "/como-comprar", label: "Cómo comprar" },
  metodosPago: { href: "/metodos-de-pago", label: "Métodos de pago" },
  pedidos: { href: "/cuenta/pedidos", label: "Mis pedidos" },
} as const;

type TrustLinkKey = keyof typeof PURCHASE_TRUST_LINKS;

type PurchaseTrustNoteProps = {
  title?: string;
  lines: readonly string[];
  linkKeys?: TrustLinkKey[];
  className?: string;
  /** Más compacto para sidebars y móvil */
  compact?: boolean;
  /** Integrado al flujo del PDP — sin caja aparte */
  variant?: "card" | "strip";
  align?: "left" | "center";
};

/** Microcopy de confianza reutilizable en PDP, carrito, checkout y cuenta. */
export function PurchaseTrustNote({
  title = "Compra asistida y segura",
  lines,
  linkKeys = ["compraSegura", "comoComprar", "metodosPago"],
  className,
  compact,
  variant = "card",
  align = "left",
}: PurchaseTrustNoteProps) {
  const links = linkKeys.map((key) => PURCHASE_TRUST_LINKS[key]);

  if (variant === "strip") {
    return (
      <div
        className={cn(
          "border-t border-border/60 pt-4",
          align === "center" ? "text-center" : "text-left",
          className,
        )}
        aria-label="Información de compra segura"
      >
        <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
          {lines.join(" ")}
        </p>
        {links.length > 0 && (
          <nav
            aria-label="Enlaces de ayuda"
            className={cn(
              "mt-2.5 flex flex-wrap gap-x-3 gap-y-1",
              align === "center" && "justify-center",
            )}
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[11px] font-medium text-foreground/70 underline-offset-2 transition-colors hover:text-foreground hover:underline sm:text-xs"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "rounded-xl border border-border/80 bg-muted/20",
        compact ? "px-3.5 py-3" : "px-4 py-4",
        className,
      )}
      aria-label="Información de compra segura"
    >
      <div className="flex items-start gap-2.5">
        <ShieldCheck
          className={cn(
            "shrink-0 text-foreground/60",
            compact ? "mt-0.5 h-3.5 w-3.5" : "mt-0.5 h-4 w-4",
          )}
          strokeWidth={1.75}
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-medium text-foreground",
              compact ? "text-xs" : "text-sm",
            )}
          >
            {title}
          </p>
          <ul className={cn("mt-2 space-y-1.5", compact && "mt-1.5")}>
            {lines.map((line) => (
              <li
                key={line}
                className={cn(
                  "leading-snug text-muted-foreground",
                  compact ? "text-[11px]" : "text-xs",
                )}
              >
                {line}
              </li>
            ))}
          </ul>
          {links.length > 0 && (
            <nav
              aria-label="Enlaces de ayuda"
              className={cn(
                "mt-3 flex flex-wrap gap-x-3 gap-y-1",
                compact && "mt-2 gap-x-2.5",
              )}
            >
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "font-medium text-foreground/75 underline-offset-2 transition-colors hover:text-foreground hover:underline",
                    compact ? "text-[11px]" : "text-xs",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </aside>
  );
}

type PurchaseTrustLinkRowProps = {
  linkKeys?: TrustLinkKey[];
  className?: string;
};

/** Fila de enlaces sin bloque — útil al pie de listas o confirmaciones. */
export function PurchaseTrustLinkRow({
  linkKeys = ["compraSegura", "metodosPago", "comoComprar"],
  className,
}: PurchaseTrustLinkRowProps) {
  const links = linkKeys.map((key) => PURCHASE_TRUST_LINKS[key]);

  return (
    <nav
      aria-label="Ayuda sobre tu compra"
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground",
        className,
      )}
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="font-medium text-foreground/70 underline-offset-2 transition-colors hover:text-foreground hover:underline"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
