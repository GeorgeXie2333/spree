import type { Category, Media, Product } from "@spree/sdk";
import type { MetadataRoute } from "next";
import {
  CENWATCH_CATEGORY_PERMALINK,
  isCenwatchCategory,
} from "@/lib/cenwatch/catalog";
import { getCenwatchLaunchCountryLocales } from "@/lib/cenwatch/markets";
import { isSupportedLocale } from "@/lib/i18n/routing";
import { getClient } from "@/lib/spree";
import { getDefaultCountry, getDefaultLocale, getStoreUrl } from "@/lib/store";

export const dynamic = "force-dynamic";

type ProductWithMedia = Product & {
  media?: Media[];
  updated_at?: string;
};

type CategoryWithTimestamp = Category & {
  updated_at?: string;
};

interface CountryLocale {
  country: string;
  locale: string;
}

interface LocaleOptions {
  locale: string;
  country: string;
}

const URLS_PER_SITEMAP = 50_000;
const STATIC_PAGES_PER_LOCALE = 5;
const ITEMS_PER_PAGE = 100;
const MAX_PAGES = 1000;
const MAX_FETCHABLE_ITEMS = ITEMS_PER_PAGE * MAX_PAGES;

const cachedProductsByLocale = new Map<string, Promise<ProductWithMedia[]>>();
const cachedCategoriesByLocale = new Map<
  string,
  Promise<CategoryWithTimestamp[]>
>();
const cachedCatalogRootsByLocale = new Map<string, Promise<Category>>();
let cachedCountryLocales: Promise<CountryLocale[]> | null = null;

function getDefaultLocaleOptions(): LocaleOptions {
  return {
    locale: getDefaultLocale(),
    country: getDefaultCountry(),
  };
}

function localeCacheKey(locale: string, country: string): string {
  return `${locale}:${country}`;
}

function getCachedProducts(
  localeOpts: LocaleOptions,
): Promise<ProductWithMedia[]> {
  const key = localeCacheKey(localeOpts.locale, localeOpts.country);
  let cached = cachedProductsByLocale.get(key);
  if (!cached) {
    cached = fetchAllProducts(localeOpts).catch((err) => {
      cachedProductsByLocale.delete(key);
      throw err;
    });
    cachedProductsByLocale.set(key, cached);
  }
  return cached;
}

function getCachedCategories(
  localeOpts: LocaleOptions,
): Promise<CategoryWithTimestamp[]> {
  const key = localeCacheKey(localeOpts.locale, localeOpts.country);
  let cached = cachedCategoriesByLocale.get(key);
  if (!cached) {
    cached = fetchAllCategories(localeOpts).catch((err) => {
      cachedCategoriesByLocale.delete(key);
      throw err;
    });
    cachedCategoriesByLocale.set(key, cached);
  }
  return cached;
}

function getCachedCatalogRoot(localeOpts: LocaleOptions): Promise<Category> {
  const key = localeCacheKey(localeOpts.locale, localeOpts.country);
  let cached = cachedCatalogRootsByLocale.get(key);
  if (!cached) {
    cached = getClient()
      .categories.get(CENWATCH_CATEGORY_PERMALINK, undefined, localeOpts)
      .catch((err) => {
        cachedCatalogRootsByLocale.delete(key);
        throw err;
      });
    cachedCatalogRootsByLocale.set(key, cached);
  }
  return cached;
}

function getCachedCountryLocales(): Promise<CountryLocale[]> {
  if (!cachedCountryLocales) {
    cachedCountryLocales = resolveCountryLocales().catch((err) => {
      cachedCountryLocales = null;
      throw err;
    });
  }
  return cachedCountryLocales;
}

export async function generateSitemaps(): Promise<Array<{ id: number }>> {
  try {
    const countryLocales = await getCachedCountryLocales();
    const [productCount, categoryCount] = await Promise.all([
      fetchTotalCount("products"),
      fetchTotalCount("categories"),
    ]);

    const urlsPerLocale =
      STATIC_PAGES_PER_LOCALE +
      Math.min(productCount, MAX_FETCHABLE_ITEMS) +
      Math.min(categoryCount, MAX_FETCHABLE_ITEMS);
    const totalUrls = urlsPerLocale * countryLocales.length;
    const sitemapCount = Math.max(1, Math.ceil(totalUrls / URLS_PER_SITEMAP));

    return Array.from({ length: sitemapCount }, (_, i) => ({ id: i }));
  } catch {
    return [{ id: 0 }];
  }
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = Number(await props.id);
  const candidate = (getStoreUrl() || "").replace(/\/$/, "");

  let baseUrl: string;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(`Unsupported protocol: ${parsed.protocol}`);
    }
    baseUrl = parsed.origin + parsed.pathname.replace(/\/$/, "");
  } catch {
    console.error(
      "Sitemap generation skipped: SITE_URL or NEXT_PUBLIC_SITE_URL must be an absolute http(s) URL.",
    );
    return [];
  }

  const countryLocales = await getCachedCountryLocales().catch((err) => {
    console.error("Sitemap: using CenWatch launch URLs only.", err);
    return getCenwatchLaunchCountryLocales();
  });

  const entries: MetadataRoute.Sitemap = [];

  for (const { country, locale } of countryLocales) {
    const basePath = `${baseUrl}/${country}/${locale}`;
    const localeOpts: LocaleOptions = { locale, country };

    entries.push(...getStaticPageEntries(basePath));

    let products: ProductWithMedia[];
    let categories: CategoryWithTimestamp[];

    try {
      [products, categories] = await Promise.all([
        getCachedProducts(localeOpts),
        getCachedCategories(localeOpts),
      ]);
    } catch (err) {
      console.error(`Sitemap: skipping ${country}/${locale} API data.`, err);
      continue;
    }

    for (const product of products) {
      entries.push({
        url: `${basePath}/products/${product.slug}`,
        ...(product.updated_at
          ? { lastModified: new Date(product.updated_at) }
          : {}),
        changeFrequency: "weekly",
        priority: 0.6,
        ...(product.media && product.media.length > 0
          ? {
              images: product.media
                .map((img: Media) => img.original_url || img.large_url)
                .filter((url: string | null): url is string => url != null),
            }
          : {}),
      });
    }

    for (const category of categories) {
      entries.push({
        url: `${basePath}/c/${category.permalink}`,
        ...(category.updated_at
          ? { lastModified: new Date(category.updated_at) }
          : {}),
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  }

  if (id === 0 && entries.length <= URLS_PER_SITEMAP) {
    return entries;
  }

  const start = id * URLS_PER_SITEMAP;
  return entries.slice(start, start + URLS_PER_SITEMAP);
}

async function resolveCountryLocales(): Promise<CountryLocale[]> {
  const localeOptions = getDefaultLocaleOptions();
  let markets;

  try {
    ({ data: markets } = await getClient().markets.list(localeOptions));
  } catch {
    return getCenwatchLaunchCountryLocales();
  }

  const seen = new Set<string>();
  const result: CountryLocale[] = [];

  for (const market of markets) {
    for (const country of market.countries ?? []) {
      const iso = country.iso.toLowerCase();
      const locales = market.supported_locales?.length
        ? market.supported_locales
        : [market.default_locale || localeOptions.locale];

      for (const locale of locales) {
        if (!isSupportedLocale(locale)) continue;
        const key = `${iso}/${locale}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push({ country: iso, locale });
      }
    }
  }

  return result.length > 0 ? result : getCenwatchLaunchCountryLocales();
}

function getStaticPageEntries(basePath: string): MetadataRoute.Sitemap {
  return [
    {
      url: basePath,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${basePath}/products`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${basePath}/operation-instructions`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${basePath}/contact`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${basePath}/order-tracking`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}

async function fetchTotalCount(
  resource: "products" | "categories",
): Promise<number> {
  const localeOptions = getDefaultLocaleOptions();
  const client = getClient();
  if (resource === "categories") {
    return (await fetchAllCategories(localeOptions)).length;
  }

  const rootCategory = await getCachedCatalogRoot(localeOptions);
  const response = await client.products.list(
    { page: 1, limit: 1, in_category: rootCategory.id },
    localeOptions,
  );
  return response.meta.count;
}

async function fetchAllProducts(
  localeOptions: LocaleOptions,
): Promise<ProductWithMedia[]> {
  const allProducts: ProductWithMedia[] = [];
  const rootCategory = await getCachedCatalogRoot(localeOptions);
  let page = 1;
  let totalPages = 1;

  do {
    const response = await getClient().products.list(
      {
        page,
        limit: ITEMS_PER_PAGE,
        expand: ["media"],
        in_category: rootCategory.id,
      },
      localeOptions,
    );
    allProducts.push(...(response.data as ProductWithMedia[]));
    totalPages = response.meta.pages;
    page++;
  } while (page <= totalPages && page <= MAX_PAGES);

  return allProducts;
}

async function fetchAllCategories(
  localeOptions: LocaleOptions,
): Promise<CategoryWithTimestamp[]> {
  const allCategories: CategoryWithTimestamp[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await getClient().categories.list(
      { page, limit: ITEMS_PER_PAGE },
      localeOptions,
    );
    allCategories.push(...response.data);
    totalPages = response.meta.pages;
    page++;
  } while (page <= totalPages && page <= MAX_PAGES);

  return allCategories.filter(isCenwatchCategory);
}
