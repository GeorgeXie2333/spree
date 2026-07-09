import type { Category } from "@spree/sdk";
import { getTranslations } from "next-intl/server";
import { PromoTile } from "@/components/commerce/PromoTile";
import { getCenwatchRootCategory } from "@/lib/data/categories";

interface HomePromosProps {
  basePath: string;
  locale: Locale;
}

/** 2-up promo tiles: dark free-shipping tile + light category/browse tile. */
export async function HomePromos({ basePath, locale }: HomePromosProps) {
  const t = await getTranslations({ locale, namespace: "home" });

  const rootCategory = await getCenwatchRootCategory();
  const categories: Category[] = rootCategory
    ? rootCategory.children?.length
      ? rootCategory.children
      : [rootCategory]
    : [];

  const firstCategory = categories[0];
  const categoryHref = firstCategory
    ? `${basePath}/c/${firstCategory.permalink}`
    : `${basePath}/products`;

  return (
    <section className="container mx-auto grid grid-cols-1 gap-5 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
      <PromoTile
        tone="dark"
        title={t("promoShippingTitle")}
        text={t("promoShippingText")}
        ctaLabel={t("promoShippingCta")}
        href={`${basePath}/products`}
      />
      <PromoTile
        tone="light"
        title={t("promoCategoryTitle")}
        text={t("promoCategoryText")}
        ctaLabel={t("promoCategoryCta")}
        href={categoryHref}
      />
    </section>
  );
}
