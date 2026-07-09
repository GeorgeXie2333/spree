import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContactPage } from "@/components/cenwatch/pages/ContactPage";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "contact",
  });

  return {
    title: t("title"),
    description: t("intro"),
  };
}

export default async function ContactRoute() {
  return <ContactPage />;
}
