import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";
import { BRAND_FAVICON_SRC, BRAND_ICON_SRC } from "@/lib/brand/assets";
import { siteBaseUrl } from "@/lib/site/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteBaseUrl()),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: BRAND_FAVICON_SRC,
    shortcut: BRAND_FAVICON_SRC,
    apple: BRAND_ICON_SRC,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#fafafa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
