import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { HomeCategoryRail } from "@/components/home/HomeCategoryRail";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeProductRail } from "@/components/home/HomeProductRail";
import { HomePromos } from "@/components/home/HomePromos";
import {
  HomeCategoryRailSkeleton,
  HomeProductRailSkeleton,
} from "@/components/home/HomeSkeletons";
import { HomeTrust } from "@/components/home/HomeTrust";
import { generateHomeMetadata } from "@/lib/metadata/home";

interface HomePageProps {
  params: Promise<{
    country: string;
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { country, locale } = await params;
  return generateHomeMetadata({ country, locale });
}

export default async function HomePage({ params }: HomePageProps) {
  const { country, locale } = await params;
  const basePath = `/${country}/${locale}`;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "home",
  });

  return (
    <div className="space-y-16 pb-20 md:space-y-20">
      <HomeHero locale={locale as Locale} />

      <Suspense fallback={<HomeCategoryRailSkeleton />}>
        <HomeCategoryRail basePath={basePath} />
      </Suspense>

      <Suspense fallback={<HomeProductRailSkeleton />}>
        <HomeProductRail
          title={t("newArrivalsTitle")}
          subtitle={t("newArrivalsSubtitle")}
          viewAllHref={`${basePath}/products?sort=-available_on`}
          viewAllLabel={t("viewAll")}
          basePath={basePath}
          country={country}
          sort="-available_on"
          listId="home-new-arrivals"
          listName="Home New Arrivals"
        />
      </Suspense>

      <Suspense fallback={<HomeProductRailSkeleton />}>
        <HomeProductRail
          title={t("bestSellersTitle")}
          subtitle={t("bestSellersSubtitle")}
          viewAllHref={`${basePath}/products?sort=best_selling`}
          viewAllLabel={t("viewAll")}
          basePath={basePath}
          country={country}
          sort="best_selling"
          listId="home-best-sellers"
          listName="Home Best Sellers"
        />
      </Suspense>

      <HomePromos basePath={basePath} locale={locale as Locale} />

      <HomeTrust locale={locale as Locale} />
    </div>
  );
}
