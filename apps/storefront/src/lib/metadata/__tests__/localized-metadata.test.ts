import { beforeEach, describe, expect, it, vi } from "vitest";

const { getProductOrNull, getCategoryOrNull } = vi.hoisted(() => ({
  getProductOrNull: vi.fn(),
  getCategoryOrNull: vi.fn(),
}));

vi.mock("@/lib/data/products", () => ({ getProductOrNull }));
vi.mock("@/lib/data/categories", () => ({ getCategoryOrNull }));

import { generateCategoriesMetadata } from "@/lib/metadata/categories";
import { generateCategoryMetadata } from "@/lib/metadata/category";
import { generateProductMetadata } from "@/lib/metadata/product";
import { generateProductsMetadata } from "@/lib/metadata/products";

describe("localized metadata", () => {
  beforeEach(() => {
    getProductOrNull.mockReset().mockResolvedValue(null);
    getCategoryOrNull.mockReset().mockResolvedValue(null);
  });

  it("uses Chinese fallback metadata for products and categories", async () => {
    await expect(
      generateProductMetadata({ country: "us", locale: "zh", slug: "missing" }),
    ).resolves.toMatchObject({ title: "未找到商品" });
    await expect(
      generateCategoryMetadata({
        country: "us",
        locale: "zh",
        permalink: ["missing"],
      }),
    ).resolves.toMatchObject({ title: "未找到分类" });

    await expect(
      generateProductsMetadata({ country: "us", locale: "zh" }),
    ).resolves.toMatchObject({
      title: "商品",
      description: "浏览我们的全部商品。",
    });
    await expect(
      generateCategoriesMetadata({ country: "us", locale: "zh" }),
    ).resolves.toMatchObject({
      title: "分类",
      description: "浏览全部商品分类。",
    });
  });
});
