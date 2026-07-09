import type { Market } from "@spree/sdk";
import { supportedLocales } from "@/lib/i18n/routing";

const launchCountries = [
  {
    iso: "US",
    iso3: "USA",
    name: "United States",
    states_required: true,
    zipcode_required: true,
  },
  {
    iso: "CA",
    iso3: "CAN",
    name: "Canada",
    states_required: true,
    zipcode_required: true,
  },
] satisfies NonNullable<Market["countries"]>;

export function getCenwatchLaunchMarkets(): Market[] {
  return [
    {
      id: "cenwatch-usd-launch",
      name: "CenWatch USD",
      currency: "USD",
      default_locale: "en",
      tax_inclusive: false,
      default: true,
      country_isos: launchCountries.map((country) => country.iso),
      supported_locales: [...supportedLocales],
      countries: launchCountries,
    },
  ];
}

export function getCenwatchLaunchCountryLocales(): Array<{
  country: string;
  locale: string;
}> {
  return launchCountries.flatMap((country) =>
    supportedLocales.map((locale) => ({
      country: country.iso.toLowerCase(),
      locale,
    })),
  );
}

export function shouldValidateSpreeMarkets(): boolean {
  return process.env.SPREE_VALIDATE_MARKETS === "true";
}
