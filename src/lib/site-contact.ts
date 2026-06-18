/**
 * Fuente única de contacto y sucursales — Radio Shalko.
 * Actualizar solo este archivo cuando cambien datos oficiales.
 */

export type StoreId = "chalco" | "amecameca";

export type StoreLocation = {
  id: StoreId;
  /** Nombre corto en UI */
  name: string;
  /** Nombre en footer / mapas */
  displayName: string;
  address: string;
  region: string;
  hours: string[];
  phoneE164: string;
  phoneDisplay: string;
  whatsappE164: string;
  mapUrl: string;
  mapEmbedUrl: string;
};

export const SITE_CONTACT = {
  email: "eradioshalko@gmail.com",
  phone: {
    e164: "+525530924459",
    national: "5530924459",
    display: "(55) 3092 4459",
    displayIntl: "+52 55 3092 4459",
  },
  whatsapp: {
    e164: "525651571531",
    display: "+52 56 5157 1531",
  },
  /** Sin URL confirmada — no mostrar icono en footer */
  facebookUrl: null as string | null,
  stores: [
    {
      id: "chalco",
      name: "Chalco",
      displayName: "Valle de Chalco",
      address: "Av. Solidaridad 142, Centro, Chalco, Edo. Méx.",
      region: "Estado de México",
      hours: [
        "Lun – Vie · 10:00 – 20:00",
        "Sáb · 10:00 – 19:00",
        "Dom · 11:00 – 16:00",
      ],
      phoneE164: "+525530924459",
      phoneDisplay: "+52 55 3092 4459",
      whatsappE164: "525651571531",
      mapUrl: "https://maps.app.goo.gl/TEwHRzLuiGikNffaA",
      mapEmbedUrl:
        "https://www.google.com/maps?q=Chalco+Centro,+Estado+de+Mexico&output=embed",
    },
    {
      id: "amecameca",
      name: "Amecameca",
      displayName: "Amecameca",
      address: "Plaza Juárez 28, Centro, Amecameca, Edo. Méx.",
      region: "Estado de México",
      hours: [
        "Lun – Vie · 10:00 – 19:00",
        "Sáb · 10:00 – 18:00",
        "Dom · cerrado",
      ],
      phoneE164: "+525530924459",
      phoneDisplay: "+52 55 3092 4459",
      whatsappE164: "525651571531",
      mapUrl: "https://maps.app.goo.gl/BsaRPavhtJ1sg5rH9",
      mapEmbedUrl:
        "https://www.google.com/maps?q=Amecameca+Centro,+Estado+de+Mexico&output=embed",
    },
  ] satisfies StoreLocation[],
  /** Resumen en footer (horario general de referencia) */
  footerHoursSummary: [
    "Lunes a Sábado · 10:00 a 20:00 hrs",
    "Domingos · 11:00 a 20:00 hrs",
  ],
} as const;

export function telHref(e164: string): string {
  return `tel:${e164.replace(/\s/g, "")}`;
}

export function mailtoHref(email: string = SITE_CONTACT.email): string {
  return `mailto:${email}`;
}

export function whatsappHref(
  phoneE164: string = SITE_CONTACT.whatsapp.e164,
  message?: string,
): string {
  const base = `https://wa.me/${phoneE164.replace(/\D/g, "")}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function getStore(id: StoreId): StoreLocation {
  const store = SITE_CONTACT.stores.find((s) => s.id === id);
  if (!store) throw new Error(`Unknown store: ${id}`);
  return store;
}

export const CONTACT_CHANNELS = [
  {
    id: "phone",
    label: "Teléfono",
    value: SITE_CONTACT.phone.displayIntl,
    href: telHref(SITE_CONTACT.phone.e164),
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    value: SITE_CONTACT.whatsapp.display,
    href: whatsappHref(),
  },
  {
    id: "email",
    label: "Correo",
    value: SITE_CONTACT.email,
    href: mailtoHref(),
  },
] as const;
