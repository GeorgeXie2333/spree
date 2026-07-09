import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClient = {
  categories: {
    get: vi.fn(),
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
  getCategoryProducts,
  getCenwatchRootCategory,
} from "@/lib/data/categories";

describe("CenWatch category products", () => {
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

  it("allows product queries for CenWatch descendants", async () => {
    mockClient.categories.get.mockResolvedValue({
      id: "category-models",
      permalink: "cenwatch/models",
    });

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

  it("fails closed for categories outside CenWatch", async () => {
    mockClient.categories.get.mockResolvedValue({
      id: "category-clothing",
      permalink: "clothing",
    });

    const response = await getCategoryProducts("category-clothing", {
      page: 3,
      limit: 12,
    });

    expect(response.data).toEqual([]);
    expect(response.meta).toMatchObject({ page: 3, limit: 12, count: 0 });
    expect(mockClient.products.list).not.toHaveBeenCalled();
  });

  it("fails closed without noisy logs when Spree is not configured", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockClient.categories.get.mockRejectedValue(
      new Error(
        "Spree client is not configured. Either call initSpreeNext() or set environment variables.",
      ),
    );

    await expect(getCenwatchRootCategory()).resolves.toBeNull();

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
