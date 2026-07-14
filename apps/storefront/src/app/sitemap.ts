import type { Category, Media, Product } from "@spree/sdk";
import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
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

type CatalogResource = "products" | "categories";

interface CountryLocale {
  country: string;
  locale: string;
}

interface CountryLocaleCatalog extends CountryLocale {
  productCount: number;
  categoryCount: number;
}

interface LocaleOptions {
  locale: string;
  country: string;
}

const URLS_PER_SITEMAP = 50_000;
const STATIC_PAGES_PER_LOCALE = 5;
const ITEMS_PER_PAGE = 100;
const PAGE_FETCH_CONCURRENCY = 10;
const SITEMAP_CACHE_REVALIDATE_SECONDS = 300;

function getDefaultLocaleOptions(): LocaleOptions {
  return {
    locale: getDefaultLocale(),
    country: getDefaultCountry(),
  };
}

function getCachedCountryLocales(): Promise<CountryLocale[]> {
  return unstable_cache(resolveCountryLocales, ["sitemap-country-locales"], {
    revalidate: SITEMAP_CACHE_REVALIDATE_SECONDS,
    tags: ["sitemap", "markets"],
  })();
}

function getCachedTotalCount(
  resource: CatalogResource,
  localeOptions: LocaleOptions,
): Promise<number> {
  return unstable_cache(
    () => fetchTotalCount(resource, localeOptions),
    [`sitemap-${resource}-count`, localeOptions.locale, localeOptions.country],
    {
      revalidate: SITEMAP_CACHE_REVALIDATE_SECONDS,
      tags: ["sitemap", resource],
    },
  )();
}

function getCachedProductsPage(
  localeOptions: LocaleOptions,
  page: number,
): Promise<ProductWithMedia[]> {
  return unstable_cache(
    async () => {
      const response = await getClient().products.list(
        { page, limit: ITEMS_PER_PAGE, expand: ["media"] },
        localeOptions,
      );
      return response.data as ProductWithMedia[];
    },
    [
      "sitemap-products-page",
      localeOptions.locale,
      localeOptions.country,
      String(page),
    ],
    {
      revalidate: SITEMAP_CACHE_REVALIDATE_SECONDS,
      tags: ["sitemap", "products"],
    },
  )();
}

function getCachedCategoriesPage(
  localeOptions: LocaleOptions,
  page: number,
): Promise<CategoryWithTimestamp[]> {
  return unstable_cache(
    async () => {
      const response = await getClient().categories.list(
        { page, limit: ITEMS_PER_PAGE },
        localeOptions,
      );
      return response.data as CategoryWithTimestamp[];
    },
    [
      "sitemap-categories-page",
      localeOptions.locale,
      localeOptions.country,
      String(page),
    ],
    {
      revalidate: SITEMAP_CACHE_REVALIDATE_SECONDS,
      tags: ["sitemap", "categories"],
    },
  )();
}

export async function generateSitemaps(): Promise<Array<{ id: number }>> {
  try {
    const catalogs = await getSitemapCatalogs();
    const totalUrls = catalogs.reduce(
      (total, catalog) => total + getCatalogUrlCount(catalog),
      0,
    );
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
  if (!Number.isSafeInteger(id) || id < 0) return [];

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

  const catalogs = await getSitemapCatalogs().catch((error) => {
    console.error("Sitemap: using CenWatch launch URLs only.", error);
    return getCenwatchLaunchCountryLocales().map((countryLocale) => ({
      ...countryLocale,
      productCount: 0,
      categoryCount: 0,
    }));
  });

  return getShardEntries(catalogs, baseUrl, id);
}

async function getSitemapCatalogs(): Promise<CountryLocaleCatalog[]> {
  const countryLocales = await getCachedCountryLocales();

  return Promise.all(
    countryLocales.map(async ({ country, locale }) => {
      const localeOptions: LocaleOptions = { country, locale };
      try {
        const [productCount, categoryCount] = await Promise.all([
          getCachedTotalCount("products", localeOptions),
          getCachedTotalCount("categories", localeOptions),
        ]);

        return {
          country,
          locale,
          productCount: normalizeCount(productCount),
          categoryCount: normalizeCount(categoryCount),
        };
      } catch (error) {
        console.error(
          `Sitemap: skipping ${country}/${locale} API data.`,
          error,
        );
        return { country, locale, productCount: 0, categoryCount: 0 };
      }
    }),
  );
}

function getCatalogUrlCount(catalog: CountryLocaleCatalog): number {
  return STATIC_PAGES_PER_LOCALE + catalog.productCount + catalog.categoryCount;
}

async function getShardEntries(
  catalogs: CountryLocaleCatalog[],
  baseUrl: string,
  id: number,
): Promise<MetadataRoute.Sitemap> {
  const shardStart = id * URLS_PER_SITEMAP;
  const shardEnd = shardStart + URLS_PER_SITEMAP;
  const entries: MetadataRoute.Sitemap = [];
  let offset = 0;

  for (const catalog of catalogs) {
    const catalogUrlCount = getCatalogUrlCount(catalog);
    const catalogEnd = offset + catalogUrlCount;

    if (catalogEnd <= shardStart) {
      offset = catalogEnd;
      continue;
    }
    if (offset >= shardEnd) break;

    const localStart = Math.max(0, shardStart - offset);
    const localEnd = Math.min(catalogUrlCount, shardEnd - offset);
    const basePath = `${baseUrl}/${catalog.country}/${catalog.locale}`;
    const localeOptions: LocaleOptions = {
      country: catalog.country,
      locale: catalog.locale,
    };

    const staticEnd = Math.min(localEnd, STATIC_PAGES_PER_LOCALE);
    if (localStart < staticEnd) {
      entries.push(
        ...getStaticPageEntries(basePath).slice(localStart, staticEnd),
      );
    }

    const productStart = Math.max(0, localStart - STATIC_PAGES_PER_LOCALE);
    const productEnd = Math.min(
      catalog.productCount,
      localEnd - STATIC_PAGES_PER_LOCALE,
    );
    if (productStart < productEnd) {
      try {
        const products = await fetchProductsInRange(
          localeOptions,
          productStart,
          productEnd,
        );
        entries.push(
          ...products.map((product) => getProductEntry(product, basePath)),
        );
      } catch (error) {
        console.error(
          `Sitemap: skipping ${catalog.country}/${catalog.locale} product data.`,
          error,
        );
      }
    }

    const categoryOffset = STATIC_PAGES_PER_LOCALE + catalog.productCount;
    const categoryStart = Math.max(0, localStart - categoryOffset);
    const categoryEnd = Math.min(
      catalog.categoryCount,
      localEnd - categoryOffset,
    );
    if (categoryStart < categoryEnd) {
      try {
        const categories = await fetchCategoriesInRange(
          localeOptions,
          categoryStart,
          categoryEnd,
        );
        entries.push(
          ...categories.map((category) => getCategoryEntry(category, basePath)),
        );
      } catch (error) {
        console.error(
          `Sitemap: skipping ${catalog.country}/${catalog.locale} category data.`,
          error,
        );
      }
    }

    offset = catalogEnd;
  }

  return entries;
}

function getProductEntry(
  product: ProductWithMedia,
  basePath: string,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${basePath}/products/${product.slug}`,
    ...(product.updated_at
      ? { lastModified: new Date(product.updated_at) }
      : {}),
    changeFrequency: "weekly",
    priority: 0.6,
    ...(product.media && product.media.length > 0
      ? {
          images: product.media
            .map((image) => image.original_url || image.large_url)
            .filter((url): url is string => url != null),
        }
      : {}),
  };
}

function getCategoryEntry(
  category: CategoryWithTimestamp,
  basePath: string,
): MetadataRoute.Sitemap[number] {
  return {
    url: `${basePath}/c/${category.permalink}`,
    ...(category.updated_at
      ? { lastModified: new Date(category.updated_at) }
      : {}),
    changeFrequency: "weekly",
    priority: 0.5,
  };
}

async function fetchProductsInRange(
  localeOptions: LocaleOptions,
  start: number,
  end: number,
): Promise<ProductWithMedia[]> {
  return fetchPaginatedRange(start, end, (page) =>
    getCachedProductsPage(localeOptions, page),
  );
}

async function fetchCategoriesInRange(
  localeOptions: LocaleOptions,
  start: number,
  end: number,
): Promise<CategoryWithTimestamp[]> {
  return fetchPaginatedRange(start, end, (page) =>
    getCachedCategoriesPage(localeOptions, page),
  );
}

async function fetchPaginatedRange<T>(
  start: number,
  end: number,
  fetchPage: (page: number) => Promise<T[]>,
): Promise<T[]> {
  if (end <= start) return [];

  const firstPage = Math.floor(start / ITEMS_PER_PAGE) + 1;
  const lastPage = Math.ceil(end / ITEMS_PER_PAGE);
  const pages = Array.from(
    { length: lastPage - firstPage + 1 },
    (_, index) => firstPage + index,
  );
  const firstPageOffset = (firstPage - 1) * ITEMS_PER_PAGE;
  const pageItems: T[] = [];

  for (let index = 0; index < pages.length; index += PAGE_FETCH_CONCURRENCY) {
    const batch = pages.slice(index, index + PAGE_FETCH_CONCURRENCY);
    const results = await Promise.all(batch.map((page) => fetchPage(page)));
    pageItems.push(...results.flat());
  }

  const rangeStart = start - firstPageOffset;
  return pageItems.slice(rangeStart, rangeStart + (end - start));
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
  resource: CatalogResource,
  localeOptions: LocaleOptions,
): Promise<number> {
  const client = getClient();
  if (resource === "products") {
    const response = await client.products.list(
      { page: 1, limit: 1 },
      localeOptions,
    );
    return response.meta.count;
  }

  const response = await client.categories.list(
    { page: 1, limit: 1 },
    localeOptions,
  );
  return response.meta.count;
}

function normalizeCount(count: number): number {
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}
