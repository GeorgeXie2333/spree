import { getTranslations } from "next-intl/server";

interface HomeHeroProps {
  locale: Locale;
}

/** Apple Store-style typographic opening: bold dark lead + gray continuation. */
export async function HomeHero({ locale }: HomeHeroProps) {
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <section className="container mx-auto px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
        {t("heroTitle")}{" "}
        <span className="text-muted-foreground">{t("heroSubtitle")}</span>
      </h1>
    </section>
  );
}
