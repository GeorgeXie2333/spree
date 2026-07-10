"use server";

import type { Category, ProductListParams } from "@spree/sdk";
import { cacheLife, cacheTag } from "next/cache";
import { getAccessToken, getClient, getLocaleOptions } from "@/lib/spree";

const TOP_LEVEL_CATEGORY_LIMIT = 100;

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

export async function getCategoryOrNull(
  idOrPermalink: string,
  params?: { expand?: string[] },
): Promise<Category | null> {
  try {
    return await getCategory(idOrPermalink, params);
  } catch (error) {
    if (!isUnconfiguredSpreeClient(error)) {
      console.error(
        `Storefront category is unavailable: ${idOrPermalink}`,
        error,
      );
    }
    return null;
  }
}

async function cachedListTopLevelCategories(
  page: number,
  options: { locale?: string; country?: string },
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("categories");
  return getClient().categories.list(
    {
      depth_eq: 1,
      expand: ["children.children"],
      limit: TOP_LEVEL_CATEGORY_LIMIT,
      page,
    },
    options,
  );
}

export async function getTopLevelCategories(): Promise<Category[]> {
  try {
    const options = await getLocaleOptions();
    const categories: Category[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const response = await cachedListTopLevelCategories(page, options);
      categories.push(...response.data);
      totalPages = response.meta.pages;
      page++;
    } while (page <= totalPages);

    return categories;
  } catch (error) {
    if (!isUnconfiguredSpreeClient(error)) {
      console.error("Storefront categories are unavailable", error);
    }
    return [];
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
  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedListCategoryProducts(categoryId, params, options, userToken);
}
