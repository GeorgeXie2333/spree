import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClient = {
  products: {
    get: vi.fn(),
    list: vi.fn(),
    filters: vi.fn(),
  },
};

vi.mock("@/lib/spree", () => ({
  getClient: () => mockClient,
  getAccessToken: vi.fn().mockResolvedValue(undefined),
  getLocaleOptions: vi.fn().mockResolvedValue({ locale: "en", country: "us" }),
}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

import {
  getCategoryProductFilters,
  getProduct,
  getProductFilters,
  getProductOrNull,
  getProducts,
} from "@/lib/data/products";
import { getAccessToken } from "@/lib/spree";

const mockGetAccessToken = vi.mocked(getAccessToken);

describe("storefront product data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.products.list.mockResolvedValue({
      data: [],
      meta: {
        page: 1,
        limit: 12,
        count: 0,
        pages: 0,
        from: 0,
        to: 0,
        in: 0,
        previous: null,
        next: null,
      },
    });
    mockClient.products.filters.mockResolvedValue({
      filters: [],
      sort_options: [],
      default_sort: "-available_on",
      total_count: 0,
    });
  });

  it("preserves the caller's category filters for the full storefront catalog", async () => {
    await getProducts({
      search: "air",
      in_category: "clothing",
      in_categories: ["clothing"],
    });

    expect(mockClient.products.list).toHaveBeenCalledWith(
      {
        search: "air",
        in_category: "clothing",
        in_categories: ["clothing"],
      },
      { locale: "en", country: "us" },
    );
  });

  it("preserves active filters for the full storefront catalog", async () => {
    await getProductFilters({
      category_id: "clothing",
      q: { in_stock: true },
    });

    expect(mockClient.products.filters).toHaveBeenCalledWith(
      {
        category_id: "clothing",
        q: { in_stock: true },
      },
      { locale: "en", country: "us" },
    );
  });

  it("scopes category facets directly to the requested category", async () => {
    await getCategoryProductFilters("category-models", {
      q: { in_stock: true },
    });

    expect(mockClient.products.filters).toHaveBeenCalledWith(
      {
        category_id: "category-models",
        q: { in_stock: true },
      },
      { locale: "en", country: "us" },
    );
  });

  it("returns a visible product even when it has no categories", async () => {
    mockClient.products.get.mockResolvedValue({
      id: "product-uncategorized",
      categories: [],
    });

    const product = await getProductOrNull("air", ["media"]);

    expect(product?.id).toBe("product-uncategorized");
    expect(mockClient.products.get).toHaveBeenCalledWith(
      "air",
      { expand: ["media"] },
      { locale: "en", country: "us" },
    );
  });

  it("passes the customer token to list, detail, and filter requests", async () => {
    mockGetAccessToken.mockResolvedValue("customer-jwt");
    mockClient.products.get.mockResolvedValue({ id: "product-air" });

    await getProducts({ search: "air" });
    await getProduct("air", { expand: ["media"] });
    await getProductFilters({ q: { in_stock: true } });
    await getCategoryProductFilters("category-models");

    expect(mockClient.products.list).toHaveBeenCalledWith(
      { search: "air" },
      { locale: "en", country: "us", token: "customer-jwt" },
    );
    expect(mockClient.products.get).toHaveBeenCalledWith(
      "air",
      { expand: ["media"] },
      { locale: "en", country: "us", token: "customer-jwt" },
    );
    expect(mockClient.products.filters).toHaveBeenNthCalledWith(
      1,
      { q: { in_stock: true } },
      { locale: "en", country: "us", token: "customer-jwt" },
    );
    expect(mockClient.products.filters).toHaveBeenNthCalledWith(
      2,
      { category_id: "category-models" },
      { locale: "en", country: "us", token: "customer-jwt" },
    );
  });

  it("returns null when a product is not visible through the Store API", async () => {
    mockClient.products.get.mockRejectedValue(new Error("not found"));

    await expect(getProductOrNull("shirt")).resolves.toBeNull();
  });
});
