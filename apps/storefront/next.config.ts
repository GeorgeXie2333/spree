import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();
const allowLocalImages = process.env.NODE_ENV !== "production";
const workspaceRoot = path.resolve(__dirname, "../..");

const spreeApiImagePattern = (() => {
  if (!process.env.SPREE_API_URL) return [];

  try {
    const url = new URL(process.env.SPREE_API_URL);
    if (url.protocol !== "http:" && url.protocol !== "https:") return [];

    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        pathname: "/rails/active_storage/**",
      },
    ];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["shop.lvh.me", "*.trycloudflare.com"],
  transpilePackages: ["@spree/sdk"],
  reactCompiler: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-dialog",
    ],
  },
  turbopack: {
    root: workspaceRoot,
  },
  outputFileTracingRoot: workspaceRoot,
  cacheComponents: true,
  cacheLife: {
    tenMinutes: {
      stale: 300, // 5 minutes client stale window
      revalidate: 600, // 10 minutes until background revalidation
      expire: 3600, // 1 hour max before recompute on idle entries
    },
  },
  images: {
    qualities: [25, 50, 75, 85, 100],
    dangerouslyAllowLocalIP: allowLocalImages,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      ...spreeApiImagePattern,
      ...(allowLocalImages
        ? [
            {
              protocol: "http" as const,
              hostname: "localhost",
              pathname: "/rails/active_storage/**",
            },
            {
              protocol: "https" as const,
              hostname: "**.trycloudflare.com",
              pathname: "/rails/active_storage/**",
            },
          ]
        : []),
    ],
  },
};

export default withNextIntl(nextConfig);
