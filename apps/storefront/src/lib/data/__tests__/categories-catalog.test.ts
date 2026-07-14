import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClient = {
  categories: {
    get: vi.fn(),
    list: vi.fn(),
  },
  products: {
    list: vi.fn(),
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
  getCategory,
  getCategoryOrNull,
  getCategoryProducts,
  getTopLevelCategories,
} from "@/lib/data/categories";
import { getAccessToken } from "@/lib/spree";

const mockGetAccessToken = vi.mocked(getAccessToken);

describe("storefront category data", () => {
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
  });

  it("allows product queries for any Store API category", async () => {
    await getCategoryProducts("category-models", { page: 2, limit: 12 });

    expect(mockClient.products.list).toHaveBeenCalledWith(
      {
        page: 2,
        limit: 12,
        in_category: "category-models",
      },
      { locale: "en", country: "us" },
    );
  });

  it("returns any visible category regardless of its permalink", async () => {
    mockClient.categories.get.mockResolvedValue({
      id: "category-clothing",
      permalink: "clothing",
    });

    await expect(getCategoryOrNull("clothing")).resolves.toMatchObject({
      id: "category-clothing",
    });
  });

  it("loads every top-level category page for navigation", async () => {
    mockClient.categories.list
      .mockResolvedValueOnce({
        data: [{ id: "category-clothing", name: "Clothing" }],
        meta: { pages: 2 },
      })
      .mockResolvedValueOnce({
        data: [{ id: "category-electronics", name: "Electronics" }],
        meta: { pages: 2 },
      });

    await expect(getTopLevelCategories()).resolves.toHaveLength(2);
    expect(mockClient.categories.list).toHaveBeenNthCalledWith(
      1,
      { depth_eq: 1, expand: ["children.children"], limit: 100, page: 1 },
      { locale: "en", country: "us" },
    );
    expect(mockClient.categories.list).toHaveBeenNthCalledWith(
      2,
      { depth_eq: 1, expand: ["children.children"], limit: 100, page: 2 },
      { locale: "en", country: "us" },
    );
  });

  it("passes the customer token to category and category-product requests", async () => {
    mockGetAccessToken.mockResolvedValue("customer-jwt");
    mockClient.categories.get.mockResolvedValue({ id: "category-models" });
    mockClient.categories.list.mockResolvedValue({
      data: [],
      meta: { pages: 0 },
    });

    await getCategory("models", { expand: ["children"] });
    await getTopLevelCategories();
    await getCategoryProducts("category-models");

    expect(mockClient.categories.get).toHaveBeenCalledWith(
      "models",
      { expand: ["children"] },
      { locale: "en", country: "us", token: "customer-jwt" },
    );
    expect(mockClient.categories.list).toHaveBeenCalledWith(
      { depth_eq: 1, expand: ["children.children"], limit: 100, page: 1 },
      { locale: "en", country: "us", token: "customer-jwt" },
    );
    expect(mockClient.products.list).toHaveBeenCalledWith(
      { in_category: "category-models" },
      { locale: "en", country: "us", token: "customer-jwt" },
    );
  });
});
