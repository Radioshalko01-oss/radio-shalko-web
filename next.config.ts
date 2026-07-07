import type { NextConfig } from "next";

const supabaseHost =
  new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://actxvfjtejmpkjernvtw.supabase.co")
    .hostname;

/** Orígenes LAN permitidos en `next dev` (iPhone vía 192.168.x.x). */
const allowedDevOrigins = [
  "192.168.1.71",
  ...(process.env.ALLOWED_DEV_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []),
];

const nextConfig: NextConfig = {
  allowedDevOrigins,
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [384, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [52, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
