import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SharedCartNotFound() {
  return (
    <div className="mx-auto max-w-lg px-5 py-32 text-center">
      <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
      <h1 className="mt-4 font-display text-xl font-semibold">Enlace no válido</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Este carrito compartido no existe o ya expiró. Pide a tu asesor un enlace nuevo.
      </p>
      <Button asChild className="mt-8 rounded-full">
        <Link href="/productos">Explorar catálogo</Link>
      </Button>
    </div>
  );
}
