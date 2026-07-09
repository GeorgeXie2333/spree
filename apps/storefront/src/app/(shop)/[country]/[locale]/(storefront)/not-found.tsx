import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getDefaultCountry, getDefaultLocale } from "@/lib/store";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notFound");
  return {
    title: t("headingMuted"),
  };
}

export default async function NotFound() {
  const t = await getTranslations("notFound");
  const basePath = `/${getDefaultCountry()}/${getDefaultLocale()}`;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-6xl font-semibold tracking-tight text-foreground md:text-7xl">
        {t("heading")}
      </h1>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-muted-foreground md:text-3xl">
        {t("headingMuted")}
      </p>
      <p className="mt-4 max-w-md text-sm text-muted-foreground">
        {t("message")}
      </p>
      <Link
        href={`${basePath}/products`}
        className="mt-8 text-sm text-link hover:underline"
      >
        {t("cta")}
        <span aria-hidden="true"> ›</span>
      </Link>
    </div>
  );
}
