import Image from "next/image";
import { getTranslations } from "next-intl/server";

interface HomeHeroProps {
  locale: Locale;
}

/** Apple Store-style typographic opening: bold dark lead + gray continuation. */
export async function HomeHero({ locale }: HomeHeroProps) {
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <section className="container mx-auto px-4 pt-8 pb-6 sm:px-6 md:pt-10 md:pb-8 lg:px-8">
      <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:gap-6 lg:gap-8">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          {t("heroTitle")}{" "}
          <span className="text-muted-foreground">{t("heroSubtitle")}</span>
        </h1>
        <Image
          src="/cenwatch/hero-watches.png"
          alt="CenWatch watches"
          width={4912}
          height={3456}
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="mx-auto h-auto max-h-[260px] w-full object-contain md:max-h-[300px] lg:max-h-[340px]"
        />
      </div>
    </section>
  );
}
