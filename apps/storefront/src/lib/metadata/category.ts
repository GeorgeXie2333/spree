import type { Metadata } from "next";
import { getCategoryOrNull } from "@/lib/data/categories";
import { getLocaleMessage } from "@/lib/i18n/messages";
import { buildCanonicalUrl } from "@/lib/seo";
import { getStoreUrl } from "@/lib/store";

export interface CategoryMetadataParams {
  country: string;
  locale: string;
  permalink: string[];
}

export async function generateCategoryMetadata({
  country,
  locale,
  permalink,
}: CategoryMetadataParams): Promise<Metadata> {
  const fullPermalink = permalink.join("/");

  const category = await getCategoryOrNull(fullPermalink, {
    expand: ["ancestors", "children"],
  });
  if (!category) {
    return { title: getLocaleMessage(locale, "metadata.categoryNotFound") };
  }

  const title = category.meta_title || category.name;
  const description =
    category.meta_description ||
    category.description ||
    getLocaleMessage(locale, "metadata.categoryDescription", {
      name: category.name,
    });

  const storeUrl = getStoreUrl();
  const canonicalUrl = storeUrl
    ? buildCanonicalUrl(
        storeUrl,
        `/${country}/${locale}/c/${category.permalink}`,
      )
    : undefined;

  return {
    title,
    description,
    ...(category.meta_keywords ? { keywords: category.meta_keywords } : {}),
    ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
    openGraph: {
      title,
      description,
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
      type: "website",
      ...(category.image_url
        ? { images: [{ url: category.image_url, alt: category.name }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(category.image_url ? { images: [category.image_url] } : {}),
    },
  };
}
