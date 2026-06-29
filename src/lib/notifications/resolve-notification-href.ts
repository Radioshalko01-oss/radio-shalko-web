/** Reescribe enlaces de pedido cliente → admin cuando el viewer es administrador. */
export function resolveNotificationHref(
  href: string | null,
  isAdmin: boolean,
): string | null {
  if (!href || !isAdmin) return href;
  const orderMatch = href.match(/^\/cuenta\/pedidos\/([0-9a-f-]+)$/i);
  if (orderMatch) return `/admin/pedidos/${orderMatch[1]}`;
  return href;
}
