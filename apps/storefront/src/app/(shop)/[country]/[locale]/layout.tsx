import { GoogleTagManager } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { Suspense } from "react";
import "../../../globals.css";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { JsonLd } from "@/components/seo/JsonLd";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { StoreProvider } from "@/contexts/StoreContext";
import {
  getCenwatchLaunchCountryLocales,
  getCenwatchLaunchMarkets,
  shouldValidateSpreeMarkets,
} from "@/lib/cenwatch/markets";
import { getMarkets } from "@/lib/data/markets";
import {
  getHtmlLang,
  isSupportedCountry,
  isSupportedLocale,
  normalizeCountry,
  normalizeLocale,
  type SupportedLocale,
} from "@/lib/i18n/routing";
import { generateStoreMetadata } from "@/lib/metadata/store";
import { buildOrganizationJsonLd } from "@/lib/seo";
import { getDefaultCountry, getDefaultLocale } from "@/lib/store";
import enMessages from "../../../../../messages/en.json";
import zhMessages from "../../../../../messages/zh.json";

const gtmId = process.env.GTM_ID;
const spreeApiOrigin = (() => {
  try {
    return process.env.SPREE_API_URL
      ? new URL(process.env.SPREE_API_URL).origin
      : undefined;
  } catch {
    return undefined;
  }
})();

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const messagesMap: Record<SupportedLocale, IntlMessages> = {
  en: enMessages,
  zh: zhMessages,
};

interface CountryLocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    country: string;
    locale: string;
  }>;
}

/**
 * Build the launch market shells without depending on a live Spree API.
 * Spree still owns market validation at runtime once the backend is online.
 */
export async function generateStaticParams() {
  const fallback = {
    country: getDefaultCountry(),
    locale: getDefaultLocale(),
  };

  const params: Array<{ country: string; locale: string }> = [];
  const seen = new Set<string>();

  const addParam = (country: string, locale: string) => {
    const key = `${country}/${locale}`;
    if (seen.has(key)) return;
    seen.add(key);
    params.push({ country, locale });
  };

  for (const { country, locale } of getCenwatchLaunchCountryLocales()) {
    addParam(country, locale);
  }

  addParam(fallback.country, fallback.locale);

  return params;
}

export async function generateMetadata({
  params,
}: CountryLocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  return generateStoreMetadata({ locale: normalizeLocale(locale) });
}

export default async function CountryLocaleLayout({
  children,
  params,
}: CountryLocaleLayoutProps) {
  const { country: rawCountry, locale: rawLocale } = await params;
  const country = rawCountry.toLowerCase();
  const locale = rawLocale.toLowerCase();
  const normalizedCountry = normalizeCountry(country);
  const normalizedLocale = normalizeLocale(locale);

  if (!isSupportedCountry(country) || !isSupportedLocale(locale)) {
    redirect(`/${normalizedCountry}/${normalizedLocale}`);
  }

  const fallbackMarkets = getCenwatchLaunchMarkets();
  const markets = shouldValidateSpreeMarkets()
    ? await getMarkets({ country: normalizedCountry, locale: normalizedLocale })
        .then((res) => res.data)
        .catch((error) => {
          console.error("CountryLocaleLayout: failed to load markets", error);
          return fallbackMarkets;
        })
    : fallbackMarkets;

  // Validate that the URL country belongs to an available market.
  // If not, redirect server-side to avoid SSR with wrong prices.
  const isValidCountry = markets.some((market) =>
    market.countries?.some(
      (c) => c.iso.toLowerCase() === country.toLowerCase(),
    ),
  );

  if (!isValidCountry) {
    const defaultMarket = markets.find((m) => m.default) ?? markets[0];
    const fallbackCountry = normalizeCountry(
      defaultMarket?.countries?.[0]?.iso ?? getDefaultCountry(),
    );
    const fallbackLocale = normalizeLocale(
      defaultMarket?.default_locale ?? getDefaultLocale(),
    );

    redirect(`/${fallbackCountry}/${fallbackLocale}`);
  }

  // Load messages statically (no runtime data access) to avoid blocking prerender
  const messages = messagesMap[normalizedLocale];

  return (
    <html lang={getHtmlLang(normalizedLocale)}>
      <head>
        {spreeApiOrigin && (
          <>
            <link rel="preconnect" href={spreeApiOrigin} />
            <link rel="dns-prefetch" href={spreeApiOrigin} />
          </>
        )}
      </head>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      <body
        className={`${geist.variable} antialiased min-h-screen flex flex-col`}
      >
        <Suspense fallback={null}>
          <NextIntlClientProvider messages={messages} locale={normalizedLocale}>
            <StoreProvider
              initialCountry={normalizedCountry}
              initialLocale={normalizedLocale}
              initialMarkets={markets}
            >
              <AuthProvider>
                <CartProvider>
                  <JsonLd data={buildOrganizationJsonLd()} />
                  {children}
                  <CartDrawer />
                  <Toaster />
                </CartProvider>
              </AuthProvider>
            </StoreProvider>
          </NextIntlClientProvider>
        </Suspense>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
