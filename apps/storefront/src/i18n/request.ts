import type { Locale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { isSupportedLocale, normalizeLocale } from "@/lib/i18n/routing";

export default getRequestConfig(async ({ locale, requestLocale }) => {
  // 1. Use explicit locale if provided (e.g. getMessages({ locale: 'en' }))
  // 2. Fall back to requestLocale from the [locale] route segment
  // 3. Default to "en"
  const requested = await requestLocale;
  const resolvedLocale = isSupportedLocale(locale)
    ? locale
    : normalizeLocale(requested);

  let messages: IntlMessages;
  try {
    messages = (await import(`../../messages/${resolvedLocale}.json`)).default;
  } catch {
    messages = (await import("../../messages/en.json")).default;
  }

  return { locale: resolvedLocale as Locale, messages };
});
