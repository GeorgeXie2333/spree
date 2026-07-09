import {
  normalizeCountry,
  normalizeLocale,
  supportedCountries,
  supportedLocales,
} from "@/lib/i18n/routing";
import { createSpreeMiddleware } from "@/lib/spree/middleware";
import { getDefaultCountry, getDefaultLocale } from "@/lib/store";

export const proxy = createSpreeMiddleware({
  defaultCountry: normalizeCountry(getDefaultCountry()),
  defaultLocale: normalizeLocale(getDefaultLocale()),
  supportedCountries: [...supportedCountries],
  supportedLocales: [...supportedLocales],
});

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
