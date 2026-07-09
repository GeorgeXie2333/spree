import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClient = {
  categories: {
    get: vi.fn(),
  },
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
  getCenwatchCategoryProductFilters,
  getCenwatchProduct,
  getProductFilters,
  getProducts,
} from "@/lib/data/products";

const rootCategory = {
  id: "category-cenwatch",
  permalink: "cenwatch",
};

describe("CenWatch-scoped product data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.categories.get.mockResolvedValue(rootCategory);
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

  it("forces every product listing into the CenWatch root", async () => {
    await getProducts({
      search: "air",
      in_category: "clothing",
      in_categories: ["clothing"],
    });

    expect(mockClient.products.list).toHaveBeenCalledWith(
      {
        search: "air",
        in_category: "category-cenwatch",
      },
      { locale: "en", country: "us" },
    );
  });

  it("fails closed when the CenWatch root is unavailable", async () => {
    mockClient.categories.get.mockRejectedValue(new Error("not found"));

    const response = await getProducts({ search: "air" });

    expect(response.data).toEqual([]);
    expect(response.meta.count).toBe(0);
    expect(mockClient.products.list).not.toHaveBeenCalled();
  });

  it("scopes product facets to the CenWatch root", async () => {
    await getProductFilters({
      category_id: "clothing",
      q: { in_stock: true },
    });

    expect(mockClient.products.filters).toHaveBeenCalledWith(
      {
        category_id: "category-cenwatch",
        q: { in_stock: true },
      },
      { locale: "en", country: "us" },
    );
  });

  it("returns empty facets when the CenWatch root is unavailable", async () => {
    mockClient.categories.get.mockRejectedValue(new Error("not found"));

    const response = await getProductFilters();

    expect(response).toEqual({
      filters: [],
      sort_options: [],
      default_sort: "",
      total_count: 0,
    });
    expect(mockClient.products.filters).not.toHaveBeenCalled();
  });

  it("allows a CenWatch descendant to further scope facets", async () => {
    mockClient.categories.get.mockResolvedValue({
      id: "category-models",
      permalink: "cenwatch/models",
    });

    await getCenwatchCategoryProductFilters("category-models", {
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

  it("rejects facet queries for unrelated categories", async () => {
    mockClient.categories.get.mockResolvedValue({
      id: "category-clothing",
      permalink: "clothing",
    });

    const response =
      await getCenwatchCategoryProductFilters("category-clothing");

    expect(response).toEqual({
      filters: [],
      sort_options: [],
      default_sort: "",
      total_count: 0,
    });
    expect(mockClient.products.filters).not.toHaveBeenCalled();
  });

  it("returns products assigned to any CenWatch descendant", async () => {
    mockClient.products.get.mockResolvedValue({
      id: "product-cenwatch",
      categories: [{ id: "models", permalink: "cenwatch/models" }],
    });

    const product = await getCenwatchProduct("air", ["media"]);

    expect(product?.id).toBe("product-cenwatch");
    expect(mockClient.products.get).toHaveBeenCalledWith(
      "air",
      { expand: ["media", "categories.ancestors"] },
      { locale: "en", country: "us" },
    );
  });

  it("rejects product details outside the CenWatch tree", async () => {
    mockClient.products.get.mockResolvedValue({
      id: "product-clothing",
      categories: [{ id: "clothing", permalink: "clothing" }],
    });

    await expect(getCenwatchProduct("shirt")).resolves.toBeNull();
  });
});
