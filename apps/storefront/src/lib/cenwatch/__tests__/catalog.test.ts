import type { Category, Product, ProductListParams } from "@spree/sdk";
import { describe, expect, it } from "vitest";
import {
  CENWATCH_CATEGORY_PERMALINK,
  isCenwatchCategory,
  isCenwatchProduct,
  scopeCenwatchFilterParams,
  scopeCenwatchProductParams,
} from "../catalog";

function category(permalink: string): Category {
  return {
    id: `category-${permalink}`,
    name: permalink,
    permalink,
    position: 1,
    depth: permalink.split("/").length - 1,
    meta_title: null,
    meta_description: null,
    meta_keywords: null,
    children_count: 0,
    parent_id: null,
    description: "",
    description_html: "",
    image_url: null,
    square_image_url: null,
    is_root: permalink === CENWATCH_CATEGORY_PERMALINK,
    is_child: permalink !== CENWATCH_CATEGORY_PERMALINK,
    is_leaf: true,
  };
}

function product(categories: Category[]): Product {
  return {
    id: "product-1",
    name: "CenWatch",
    slug: "cenwatch",
    meta_title: null,
    meta_description: null,
    meta_keywords: null,
    variant_count: 1,
    available_on: null,
    purchasable: true,
    in_stock: true,
    backorderable: false,
    available: true,
    description: null,
    description_html: null,
    default_variant_id: "variant-1",
    thumbnail_url: null,
    tags: [],
    price: {
      id: "price-1",
      amount: "199",
      amount_in_cents: 19900,
      currency: "USD",
      display_amount: "$199.00",
      compare_at_amount: null,
      compare_at_amount_in_cents: null,
      display_compare_at_amount: null,
      price_list_id: null,
    },
    original_price: null,
    categories,
  };
}

describe("CenWatch catalog guard", () => {
  it("accepts the CenWatch root category", () => {
    expect(isCenwatchCategory(category("cenwatch"))).toBe(true);
  });

  it("accepts descendants at any depth", () => {
    expect(isCenwatchCategory(category("cenwatch/models/air"))).toBe(true);
  });

  it("rejects categories outside the CenWatch tree", () => {
    expect(isCenwatchCategory(category("clothing/caps"))).toBe(false);
    expect(isCenwatchCategory(category("cenwatch-accessories"))).toBe(false);
  });

  it("accepts only products assigned to the CenWatch tree", () => {
    expect(
      isCenwatchProduct(
        product([category("clothing"), category("cenwatch/models")]),
      ),
    ).toBe(true);
    expect(isCenwatchProduct(product([category("clothing")]))).toBe(false);
    expect(isCenwatchProduct(product([]))).toBe(false);
  });

  it("forces product queries into the CenWatch root category", () => {
    const params: ProductListParams = {
      search: "air",
      sort: "-available_on",
      in_category: "other",
      in_categories: ["other", "clothing"],
    };

    expect(scopeCenwatchProductParams(params, "category-cenwatch")).toEqual({
      search: "air",
      sort: "-available_on",
      in_category: "category-cenwatch",
    });
  });

  it("forces filter queries into the requested CenWatch category", () => {
    expect(
      scopeCenwatchFilterParams(
        { category_id: "other", q: { in_stock: true } },
        "category-cenwatch",
      ),
    ).toEqual({
      category_id: "category-cenwatch",
      q: { in_stock: true },
    });
  });
});
