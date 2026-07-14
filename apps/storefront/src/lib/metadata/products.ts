import type { Metadata } from "next";
import { getLocaleMessage } from "@/lib/i18n/messages";
import { buildCanonicalUrl } from "@/lib/seo";
import { getStoreUrl } from "@/lib/store";

interface ProductsMetadataParams {
  country: string;
  locale: string;
}

export async function generateProductsMetadata({
  country,
  locale,
}: ProductsMetadataParams): Promise<Metadata> {
  const title = getLocaleMessage(locale, "metadata.productsTitle");
  const description = getLocaleMessage(locale, "metadata.productsDescription");
  const storeUrl = getStoreUrl();
  const canonicalUrl = storeUrl
    ? buildCanonicalUrl(storeUrl, `/${country}/${locale}/products`)
    : undefined;

  return {
    title,
    description,
    ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
    openGraph: {
      title,
      description,
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
      type: "website",
    },
  };
}
