import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AccountPageShellProps = {
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
  className?: string;
};

/** Contenedor consistente para subpáginas de /cuenta. */
export function AccountPageShell({
  backHref = "/cuenta",
  backLabel = "Volver a mi cuenta",
  children,
  className,
}: AccountPageShellProps) {
  return (
    <div className={cn("mx-auto w-full max-w-3xl px-5 pb-28 md:px-8", className)}>
      <Link
        href={backHref}
        className="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>
      <div className="mt-8">{children}</div>
    </div>
  );
}
