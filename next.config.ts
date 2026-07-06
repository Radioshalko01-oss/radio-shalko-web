import type { NextConfig } from "next";

const supabaseHost =
  new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://actxvfjtejmpkjernvtw.supabase.co")
    .hostname;

const nextConfig: NextConfig = {
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
