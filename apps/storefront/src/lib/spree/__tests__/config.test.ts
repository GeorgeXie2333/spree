import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getClient, getConfig, initSpreeNext, resetClient } from "../config";

let capturedHeaders: Record<string, string> = {};

function installFetchSpy() {
  vi.stubGlobal(
    "fetch",
    async (_input: string | URL | Request, init?: RequestInit) => {
      capturedHeaders = Object.fromEntries(
        Object.entries((init?.headers as Record<string, string>) || {}),
      );
      return new Response(
        JSON.stringify({
          data: [],
          meta: {
            page: 1,
            limit: 25,
            count: 0,
            pages: 0,
            from: 0,
            to: 0,
            in: 0,
            previous: null,
            next: null,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    },
  );
}

describe("Spree client channel configuration", () => {
  beforeEach(() => {
    resetClient();
    capturedHeaders = {};
    installFetchSpy();
  });

  afterEach(() => {
    resetClient();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("passes an explicit channel into the SDK client and request headers", async () => {
    initSpreeNext({
      baseUrl: "https://api.example.test",
      publishableKey: "publishable-key",
      channel: "shop",
    });

    await getClient().products.list();

    expect(getConfig().channel).toBe("shop");
    expect(capturedHeaders["x-spree-channel"]).toBe("shop");
  });

  it("uses SPREE_CHANNEL_CODE during automatic initialization", async () => {
    vi.stubEnv("SPREE_API_URL", "https://api.example.test");
    vi.stubEnv("SPREE_PUBLISHABLE_KEY", "publishable-key");
    vi.stubEnv("SPREE_CHANNEL_CODE", "wholesale");

    await getClient().products.list();

    expect(getConfig().channel).toBe("wholesale");
    expect(capturedHeaders["x-spree-channel"]).toBe("wholesale");
  });

  it("uses the Store API default channel when no channel is configured", async () => {
    vi.stubEnv("SPREE_API_URL", "https://api.example.test");
    vi.stubEnv("SPREE_PUBLISHABLE_KEY", "publishable-key");

    await getClient().products.list();

    expect(getConfig().channel).toBeUndefined();
    expect(capturedHeaders["x-spree-channel"]).toBeUndefined();
  });
});
