/** POS a pantalla completa; carrito aislado (sesiones locales, sin QuoteProvider). */
export default function VendedorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-50">{children}</div>
  );
}
