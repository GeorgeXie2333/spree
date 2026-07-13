import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeProductRail } from "@/components/home/HomeProductRail";
import { HomePromos } from "@/components/home/HomePromos";
import { HomeProductRailSkeleton } from "@/components/home/HomeSkeletons";
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

      <HomePromos basePath={basePath} locale={locale as Locale} />

      <HomeTrust locale={locale as Locale} />
    </div>
  );
}
