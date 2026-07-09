import Image from "next/image";
import { getTranslations } from "next-intl/server";

interface HomeHeroProps {
  locale: Locale;
}

/** Apple Store-style typographic opening: bold dark lead + gray continuation. */
export async function HomeHero({ locale }: HomeHeroProps) {
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <section className="container mx-auto px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-12">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          {t("heroTitle")}{" "}
          <span className="text-muted-foreground">{t("heroSubtitle")}</span>
        </h1>
        <Image
          src="/cenwatch/hero-watches.jpg"
          alt="CenWatch watches"
          width={4912}
          height={3456}
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="mx-auto h-auto w-full object-contain"
        />
      </div>
    </section>
  );
}
