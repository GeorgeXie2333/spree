"use server";

import type {
  Product,
  ProductFiltersParams,
  ProductListParams,
} from "@spree/sdk";
import { cacheLife, cacheTag } from "next/cache";
import { getAccessToken, getClient, getLocaleOptions } from "@/lib/spree";

type CatalogOptions = { locale?: string; country?: string };

function withCatalogToken(options: CatalogOptions, token?: string) {
  return token ? { ...options, token } : options;
}

/**
 * Cached product list fetch. Cache key is derived from all function
 * arguments by Next.js "use cache":
 *
 * - locale/country: determines language and market-specific pricing
 * - userToken: both segments the cache and authenticates the SDK request.
 *   Authenticated users may see different prices (B2B, loyalty), while each
 *   distinct JWT receives a separate cache entry.
 *   Guest users pass undefined.
 */
export async function cachedListProducts(
  params: ProductListParams | undefined,
  options: CatalogOptions,
  userToken?: string,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("products");
  return getClient().products.list(
    params,
    withCatalogToken(options, userToken),
  );
}

export async function getProducts(params?: ProductListParams) {
  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedListProducts(params, options, userToken);
}

/**
 * Persistent cached product detail fetch. Cache key is derived from:
 *
 * - slugOrId, expand: identify the product and response shape
 * - locale/country: determines language and market-specific pricing
 * - userToken: both segments the cache and authenticates the SDK request.
 *   Guest users pass undefined, so all guests share one entry.
 */
export async function cachedGetProduct(
  slugOrId: string,
  expand: string[],
  options: CatalogOptions,
  userToken?: string,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("products", `product:${slugOrId}`);
  return getClient().products.get(
    slugOrId,
    { expand },
    withCatalogToken(options, userToken),
  );
}

export async function getProduct(
  slugOrId: string,
  params?: { expand?: string[] },
) {
  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedGetProduct(slugOrId, params?.expand ?? [], options, userToken);
}

export async function getProductOrNull(
  slugOrId: string,
  expand: string[] = [],
): Promise<Product | null> {
  try {
    return await getProduct(slugOrId, { expand });
  } catch (error) {
    console.error(`Storefront product is unavailable: ${slugOrId}`, error);
    return null;
  }
}

async function cachedGetProductFilters(
  params: ProductFiltersParams | undefined,
  options: CatalogOptions,
  userToken?: string,
) {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("product-filters");
  return getClient().products.filters(
    params,
    withCatalogToken(options, userToken),
  );
}

export async function getProductFilters(params?: ProductFiltersParams) {
  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedGetProductFilters(params, options, userToken);
}

export async function getCategoryProductFilters(
  categoryId: string,
  params?: ProductFiltersParams,
) {
  const options = await getLocaleOptions();
  const userToken = await getAccessToken();
  return cachedGetProductFilters(
    { ...params, category_id: categoryId },
    options,
    userToken,
  );
}
