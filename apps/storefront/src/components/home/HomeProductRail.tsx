import type { Product } from "@spree/sdk";
import { ProductRail } from "@/components/commerce/ProductRail";
import { SectionHeader } from "@/components/commerce/SectionHeader";
import { PRODUCT_CARD_FIELDS } from "@/lib/data/cached";
import { resolveCurrency } from "@/lib/data/markets";
import { getProducts } from "@/lib/data/products";

interface HomeProductRailProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  basePath: string;
  country: string;
  /** Spree sort param, e.g. "-available_on" or "best_selling". */
  sort: string;
  listId: string;
  listName: string;
}

/**
 * Generic server wrapper: fetches a product listing and renders it as a
 * SectionHeader + horizontal ProductRail. Renders nothing when the fetch
 * fails or returns no products, so a downed backend never crashes the page.
 */
export async function HomeProductRail({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
  basePath,
  country,
  sort,
  listId,
  listName,
}: HomeProductRailProps) {
  const [products, currency] = await Promise.all([
    getProducts({ limit: 12, sort, fields: PRODUCT_CARD_FIELDS })
      .then((res) => res.data ?? [])
      .catch((error) => {
        console.error(`HomeProductRail(${listId}): failed to load`, error);
        return [] as Product[];
      }),
    resolveCurrency(country).catch(() => undefined),
  ]);

  if (products.length === 0) return null;

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        viewAllHref={viewAllHref}
        viewAllLabel={viewAllLabel}
        className="mb-6"
      />
      <ProductRail
        products={products}
        basePath={basePath}
        listId={listId}
        listName={listName}
        currency={currency}
      />
    </section>
  );
}
