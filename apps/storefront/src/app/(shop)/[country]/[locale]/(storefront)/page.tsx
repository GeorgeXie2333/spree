import type { Metadata } from "next";
import { CenwatchLanding } from "@/components/home/CenwatchLanding";
import { getCenwatchContent } from "@/content/cenwatch";
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
  const content = getCenwatchContent(locale);

  return <CenwatchLanding basePath={basePath} content={content} />;
}
