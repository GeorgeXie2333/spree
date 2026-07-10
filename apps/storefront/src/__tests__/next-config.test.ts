import type { NextConfig } from "next";
import { afterEach, describe, expect, it, vi } from "vitest";

async function loadNextConfig(): Promise<NextConfig> {
  vi.resetModules();
  const configModule = await import("../../next.config");
  return configModule.default as NextConfig;
}

describe("Next.js product image configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows Active Storage images from the public Spree origin", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SPREE_API_URL", "http://web:3000");
    vi.stubEnv("SPREE_PUBLIC_URL", "https://api-shop.cenwatch.com");

    const config = await loadNextConfig();

    expect(config.images?.remotePatterns).toEqual([
      {
        protocol: "https",
        hostname: "api-shop.cenwatch.com",
        pathname: "/rails/active_storage/**",
      },
    ]);
  });
});
