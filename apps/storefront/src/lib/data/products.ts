"use server";

import type {
  PaginatedResponse,
  Product,
  ProductFiltersParams,
  ProductFiltersResponse,
  ProductListParams,
} from "@spree/sdk";
import { cacheLife, cacheTag } from "next/cache";
import {
  isCenwatchProduct,
  scopeCenwatchFilterParams,
  scopeCenwatchProductParams,
} from "@/lib/cenwatch/catalog";
import { getAccessToken, getClient, getLocaleOptions } from "@/lib/spree";
import { getCenwatchCategory, getCenwatchRootCategory } from "./categories";

const EMPTY_FILTERS: ProductFiltersResponse = {
  filters: [],
  sort_options: [],
  default_sort: "",
  total_count: 0,
};

function emptyProducts(params?: ProductListParams): PaginatedResponse<Product> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 25;
  return {
    data: [],
    meta: {
      page,
      limit,
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

/**
 * Cached product list fetch. Cache key is derived from all function
 * arguments by Next.js "use cache":
 *
 * - locale/country: determines language and market-specific pricing
 * - userToken: per-user cache segmentation (separate arg, NOT passed to
 *   SDK). Authenticated users may see different prices (B2B, loyalty).
 *   Each user's JWT is unique so the cache is segmented per user.
 *   Guest users pass undefined.
 */
export async function cachedListProducts(
  params: ProductListParams | undefined,
  options: { locale?: string; country?: string },
  _userToken?: string,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("products");
  return getClient().products.list(params, options);
}

export async function getProducts(params?: ProductListParams) {
  const rootCategory = await getCenwatchRootCategory();
  if (!rootCategory) return emptyProducts(params);

  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedListProducts(
    scopeCenwatchProductParams(params, rootCategory.id),
    options,
    userToken,
  );
}

/**
 * Persistent cached product detail fetch. Cache key is derived from:
 *
 * - slugOrId, expand: identify the product and response shape
 * - locale/country: determines language and market-specific pricing
 * - userToken: per-user cache segmentation (separate arg, NOT passed to
 *   SDK). Authenticated users may see different prices (B2B, loyalty).
 *   Guest users pass undefined, so all guests share one entry.
 */
export async function cachedGetProduct(
  slugOrId: string,
  expand: string[],
  options: { locale?: string; country?: string },
  _userToken?: string,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("products", `product:${slugOrId}`);
  return getClient().products.get(slugOrId, { expand }, options);
}

export async function getProduct(
  slugOrId: string,
  params?: { expand?: string[] },
) {
  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedGetProduct(slugOrId, params?.expand ?? [], options, userToken);
}

export async function getCenwatchProduct(
  slugOrId: string,
  expand: string[] = [],
): Promise<Product | null> {
  const requiredExpand = Array.from(
    new Set([...expand, "categories.ancestors"]),
  );

  try {
    const product = await getProduct(slugOrId, { expand: requiredExpand });
    return isCenwatchProduct(product) ? product : null;
  } catch (error) {
    console.error(`CenWatch product is unavailable: ${slugOrId}`, error);
    return null;
  }
}

async function cachedGetProductFilters(
  params: ProductFiltersParams | undefined,
  options: { locale?: string; country?: string },
  _userToken?: string,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("product-filters");
  return getClient().products.filters(params, options);
}

export async function getProductFilters(params?: ProductFiltersParams) {
  const rootCategory = await getCenwatchRootCategory();
  if (!rootCategory) return EMPTY_FILTERS;

  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedGetProductFilters(
    scopeCenwatchFilterParams(params, rootCategory.id),
    options,
    userToken,
  );
}

export async function getCenwatchCategoryProductFilters(
  categoryId: string,
  params?: ProductFiltersParams,
) {
  const category = await getCenwatchCategory(categoryId);
  if (!category) return EMPTY_FILTERS;

  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedGetProductFilters(
    scopeCenwatchFilterParams(params, category.id),
    options,
    userToken,
  );
}
