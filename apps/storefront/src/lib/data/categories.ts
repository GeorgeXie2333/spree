"use server";

import type {
  Category,
  PaginatedResponse,
  Product,
  ProductListParams,
} from "@spree/sdk";
import { cacheLife, cacheTag } from "next/cache";
import {
  CENWATCH_CATEGORY_PERMALINK,
  isCenwatchCategory,
} from "@/lib/cenwatch/catalog";
import { getAccessToken, getClient, getLocaleOptions } from "@/lib/spree";

function isUnconfiguredSpreeClient(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.startsWith("Spree client is not configured.")
  );
}

async function cachedGetCategory(
  idOrPermalink: string,
  params: { expand?: string[] } | undefined,
  options: { locale?: string; country?: string },
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("category");
  return getClient().categories.get(idOrPermalink, params, options);
}

export async function getCategory(
  idOrPermalink: string,
  params?: { expand?: string[] },
) {
  const options = await getLocaleOptions();
  return cachedGetCategory(idOrPermalink, params, options);
}

export async function getCenwatchRootCategory(): Promise<Category | null> {
  try {
    return await getCategory(CENWATCH_CATEGORY_PERMALINK, {
      expand: ["children.children"],
    });
  } catch (error) {
    if (!isUnconfiguredSpreeClient(error)) {
      console.error("CenWatch catalog root is unavailable", error);
    }
    return null;
  }
}

export async function getCenwatchCategory(
  idOrPermalink: string,
  params?: { expand?: string[] },
): Promise<Category | null> {
  try {
    const category = await getCategory(idOrPermalink, params);
    return isCenwatchCategory(category) ? category : null;
  } catch (error) {
    console.error(`CenWatch category is unavailable: ${idOrPermalink}`, error);
    return null;
  }
}

/**
 * Persistent cached category products fetch. Cache key is derived from
 * all function arguments (categoryId, params, locale, country, userToken).
 * Guest users pass undefined so the cache entry is shared.
 */
async function cachedListCategoryProducts(
  categoryId: string,
  params: ProductListParams | undefined,
  options: { locale?: string; country?: string },
  _userToken?: string,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("products", `category-products:${categoryId}`);
  return getClient().products.list(
    { ...params, in_category: categoryId },
    options,
  );
}

export async function getCategoryProducts(
  categoryId: string,
  params?: ProductListParams,
) {
  const category = await getCenwatchCategory(categoryId);
  if (!category) return emptyCategoryProducts(params);

  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedListCategoryProducts(category.id, params, options, userToken);
}

function emptyCategoryProducts(
  params?: ProductListParams,
): PaginatedResponse<Product> {
  return {
    data: [],
    meta: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 25,
      count: 0,
      pages: 0,
      from: 0,
      to: 0,
      in: 0,
      previous: null,
      next: null,
    },
  };
}
