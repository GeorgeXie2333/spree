import type { Category, Product } from "@spree/sdk";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProductRail } from "@/components/commerce/ProductRail";
import { SectionHeader } from "@/components/commerce/SectionHeader";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { PRODUCT_CARD_FIELDS, PRODUCT_PAGE_EXPAND } from "@/lib/data/cached";
import { resolveCurrency } from "@/lib/data/markets";
import { getProductOrNull, getProducts } from "@/lib/data/products";
import { generateProductMetadata } from "@/lib/metadata/product";
import {
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
  buildProductJsonLd,
} from "@/lib/seo";
import { getStoreUrl } from "@/lib/store";
import { ProductDetails } from "./ProductDetails";

interface ProductPageProps {
  params: Promise<{
    country: string;
    locale: string;
    slug: string;
  }>;
  searchParams: Promise<{
    category_id?: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { country, locale, slug } = await params;
  return generateProductMetadata({ country, locale, slug });
}

function findBreadcrumbCategory(
  categories: Category[],
  categoryId?: string,
): Category | undefined {
  if (categories.length === 0) return undefined;
  if (categoryId) {
    const match = categories.find((c) => c.id === categoryId);
    if (match) return match;
  }
  return categories[0];
}

/** Products from the same category as `product`, excluding itself. */
async function getRelatedProducts(
  product: Product,
  category?: Category,
): Promise<Product[]> {
  if (!category) return [];
  try {
    const { data } = await getProducts({
      in_category: category.id,
      limit: 8,
      fields: PRODUCT_CARD_FIELDS,
    });
    return data.filter((p) => p.id !== product.id);
  } catch {
    return [];
  }
}

export default async function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  const { country, locale, slug } = await params;
  const { category_id } = await searchParams;
  const basePath = `/${country}/${locale}`;

  const product = await getProductOrNull(slug, PRODUCT_PAGE_EXPAND);
  if (!product) {
    notFound();
  }

  const storeUrl = getStoreUrl();
  const canonicalUrl = storeUrl
    ? buildCanonicalUrl(
        storeUrl,
        `/${country}/${locale}/products/${product.slug}`,
      )
    : undefined;

  const breadcrumbCategory = findBreadcrumbCategory(
    product.categories || [],
    category_id,
  );
  const relatedCategory = product.categories?.[0];

  const [relatedProducts, currency, t] = await Promise.all([
    getRelatedProducts(product, relatedCategory),
    resolveCurrency(country),
    getTranslations({ locale: locale as Locale, namespace: "pdp" }),
  ]);

  return (
    <>
      {canonicalUrl && (
        <JsonLd data={buildProductJsonLd(product, canonicalUrl)} />
      )}
      {breadcrumbCategory && storeUrl && (
        <JsonLd
          data={buildBreadcrumbJsonLd(breadcrumbCategory, basePath, storeUrl, {
            name: product.name,
            slug: product.slug,
          })}
        />
      )}
      <div className="container mx-auto px-4 pt-6 sm:px-6 lg:px-8">
        {breadcrumbCategory && (
          <Breadcrumbs
            category={breadcrumbCategory}
            basePath={basePath}
            productName={product.name}
            locale={locale}
          />
        )}
      </div>
      <ProductDetails product={product} basePath={basePath} />
      {relatedProducts.length > 0 && (
        <section className="container mx-auto px-4 pt-8 pb-16 sm:px-6 lg:px-8">
          <SectionHeader
            title={t("relatedTitle")}
            subtitle={t("relatedSubtitle")}
          />
          <div className="mt-8">
            <ProductRail
              products={relatedProducts}
              basePath={basePath}
              listId="pdp-related"
              listName="Related Products"
              currency={currency}
            />
          </div>
        </section>
      )}
    </>
  );
}
