import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { defineConfig, devices } from "@playwright/test";

const e2eEnv: Record<string, string> = {};

if (existsSync(".env.e2e")) {
  for (const [key, value] of Object.entries(
    parseEnv(readFileSync(".env.e2e", "utf8")),
  )) {
    if (value !== undefined) {
      e2eEnv[key] = value;
    }
  }
}

/**
 * Playwright config for the storefront E2E suite.
 *
 * Prerequisites (run once before `pnpm --filter @cenwatch/storefront test:e2e`):
 *   pnpm --filter @cenwatch/storefront e2e:up      # boots Docker + bootstraps Spree via @spree/cli
 *
 * That seeds Spree with sample data and writes `.env.e2e` with the
 * publishable key the storefront needs.
 *
 * The `webServer` block boots `next dev` against `.env.e2e` and waits for it
 * to respond before running tests.
 */
export default defineConfig({
  testDir: "./e2e",
  // The guest checkout walks home → PDP → cart → checkout → Stripe against
  // dev-mode Next.js + dockerized Spree, which blows well past Playwright's
  // 30s default on CI runners — each retry was dying mid-flow wherever it
  // happened to be standing.
  timeout: 120_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "node node_modules/next/dist/bin/next dev -p 3001 --turbopack",
    env: e2eEnv,
    url: "http://localhost:3001/us/en",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
