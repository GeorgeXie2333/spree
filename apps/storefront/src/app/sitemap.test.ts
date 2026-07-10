import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClient = {
  markets: { list: vi.fn() },
  products: { list: vi.fn() },
  categories: { get: vi.fn(), list: vi.fn() },
};

vi.mock("@/lib/spree", () => ({
  getClient: () => mockClient,
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
      meta: { pages: 1 },
    });
    mockClient.categories.list.mockResolvedValue({
      data: [{ permalink: "clothing", name: "Clothing" }],
      meta: { pages: 1 },
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
});
