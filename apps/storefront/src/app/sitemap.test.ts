import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUnstableCache } = vi.hoisted(() => ({
  mockUnstableCache: vi.fn(),
}));

const mockClient = {
  markets: { list: vi.fn() },
  products: { list: vi.fn() },
  categories: { get: vi.fn(), list: vi.fn() },
};

vi.mock("@/lib/spree", () => ({
  getClient: () => mockClient,
}));

vi.mock("next/cache", () => ({
  unstable_cache: mockUnstableCache,
}));

vi.mock("@/lib/store", () => ({
  getDefaultCountry: () => "us",
  getDefaultLocale: () => "en",
  getStoreUrl: () => "https://shop.example.com",
}));

describe("sitemap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockUnstableCache.mockImplementation((callback) => callback);
  });

  it("includes all Store API visible products and categories without a catalog root", async () => {
    mockClient.markets.list.mockResolvedValue({
      data: [
        {
          countries: [{ iso: "US" }],
          default_locale: "en",
          supported_locales: ["en"],
        },
      ],
    });
    mockClient.products.list.mockResolvedValue({
      data: [{ slug: "unclassified-watch", media: [] }],
      meta: { count: 1, pages: 1 },
    });
    mockClient.categories.list.mockResolvedValue({
      data: [{ permalink: "clothing", name: "Clothing" }],
      meta: { count: 1, pages: 1 },
    });

    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap({ id: Promise.resolve("0") });

    expect(entries.map((entry) => entry.url)).toContain(
      "https://shop.example.com/us/en/products/unclassified-watch",
    );
    expect(entries.map((entry) => entry.url)).toContain(
      "https://shop.example.com/us/en/c/clothing",
    );
    expect(mockClient.categories.get).not.toHaveBeenCalled();
    expect(mockClient.products.list).toHaveBeenCalledWith(
      { page: 1, limit: 100, expand: ["media"] },
      { locale: "en", country: "us" },
    );
  });

  it("allocates sitemap shards from each market's visible catalog size", async () => {
    mockClient.markets.list.mockResolvedValue({
      data: [
        {
          countries: [{ iso: "US" }],
          default_locale: "en",
          supported_locales: ["en"],
        },
        {
          countries: [{ iso: "CA" }],
          default_locale: "en",
          supported_locales: ["en"],
        },
      ],
    });
    mockClient.products.list.mockImplementation((_params, options) =>
      Promise.resolve({
        data: [],
        meta: { count: options?.country === "ca" ? 50_000 : 1, pages: 1 },
      }),
    );
    mockClient.categories.list.mockResolvedValue({
      data: [],
      meta: { count: 0, pages: 1 },
    });

    const { generateSitemaps } = await import("@/app/sitemap");

    await expect(generateSitemaps()).resolves.toEqual([{ id: 0 }, { id: 1 }]);
  });

  it("uses an expiring cache boundary for sitemap market and catalog data", async () => {
    mockClient.markets.list.mockResolvedValue({
      data: [
        {
          countries: [{ iso: "US" }],
          default_locale: "en",
          supported_locales: ["en"],
        },
      ],
    });
    mockClient.products.list.mockResolvedValue({
      data: [{ slug: "cached-watch", media: [] }],
      meta: { count: 1, pages: 1 },
    });
    mockClient.categories.list.mockResolvedValue({
      data: [],
      meta: { count: 0, pages: 0 },
    });

    const { default: sitemap } = await import("@/app/sitemap");
    await sitemap({ id: Promise.resolve("0") });

    expect(mockUnstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      ["sitemap-country-locales"],
      expect.objectContaining({
        revalidate: 300,
        tags: expect.arrayContaining(["sitemap", "markets"]),
      }),
    );
    expect(mockUnstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      ["sitemap-products-count", "en", "us"],
      expect.objectContaining({
        revalidate: 300,
        tags: expect.arrayContaining(["sitemap", "products"]),
      }),
    );
    expect(mockUnstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      ["sitemap-products-page", "en", "us", "1"],
      expect.objectContaining({
        revalidate: 300,
        tags: expect.arrayContaining(["sitemap", "products"]),
      }),
    );
  });

  it("fetches only the catalog pages covered by the requested sitemap shard", async () => {
    mockClient.markets.list.mockResolvedValue({
      data: [
        {
          countries: [{ iso: "US" }],
          default_locale: "en",
          supported_locales: ["en"],
        },
      ],
    });
    mockClient.products.list.mockImplementation((params) => {
      if (params.limit === 1) {
        return Promise.resolve({ data: [], meta: { count: 50_001, pages: 1 } });
      }

      if (params.page === 500) {
        return Promise.resolve({
          data: Array.from({ length: 100 }, (_, index) => ({
            slug: `watch-${49_900 + index}`,
            media: [],
          })),
          meta: { count: 50_001, pages: 501 },
        });
      }

      if (params.page === 501) {
        return Promise.resolve({
          data: [{ slug: "watch-50000", media: [] }],
          meta: { count: 50_001, pages: 501 },
        });
      }

      throw new Error(`Unexpected product page ${params.page}`);
    });
    mockClient.categories.list.mockResolvedValue({
      data: [],
      meta: { count: 0, pages: 0 },
    });

    const { default: sitemap } = await import("@/app/sitemap");
    const entries = await sitemap({ id: Promise.resolve("1") });

    expect(entries.map((entry) => entry.url)).toEqual([
      "https://shop.example.com/us/en/products/watch-49995",
      "https://shop.example.com/us/en/products/watch-49996",
      "https://shop.example.com/us/en/products/watch-49997",
      "https://shop.example.com/us/en/products/watch-49998",
      "https://shop.example.com/us/en/products/watch-49999",
      "https://shop.example.com/us/en/products/watch-50000",
    ]);
    expect(
      mockClient.products.list.mock.calls
        .map(([params]) => params)
        .filter((params) => params.limit === 100)
        .map((params) => params.page),
    ).toEqual([500, 501]);
  });
});
