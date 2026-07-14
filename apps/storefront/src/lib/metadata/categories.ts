import type { Metadata } from "next";
import { getLocaleMessage } from "@/lib/i18n/messages";
import { buildCanonicalUrl } from "@/lib/seo";
import { getStoreUrl } from "@/lib/store";

interface CategoriesMetadataParams {
  country: string;
  locale: string;
}

export async function generateCategoriesMetadata({
  country,
  locale,
}: CategoriesMetadataParams): Promise<Metadata> {
  const title = getLocaleMessage(locale, "metadata.categoriesTitle");
  const description = getLocaleMessage(
    locale,
    "metadata.categoriesDescription",
  );
  const storeUrl = getStoreUrl();
  const canonicalUrl = storeUrl
    ? buildCanonicalUrl(storeUrl, `/${country}/${locale}/c`)
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
