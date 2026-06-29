import { redirect } from "next/navigation";

/** Modo vendedor desacoplado (CART-6): el carrito unificado vive en /carrito. */
export default function AdminVendedorPage() {
  redirect("/carrito");
}
