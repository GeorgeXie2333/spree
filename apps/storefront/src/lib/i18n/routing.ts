export const supportedCountries = ["us", "ca"] as const;
export type SupportedCountry = (typeof supportedCountries)[number];

export const supportedLocales = ["en", "zh"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultCountry: SupportedCountry = "us";
export const defaultLocale: SupportedLocale = "en";

export function isSupportedCountry(
  value: string | undefined,
): value is SupportedCountry {
  return supportedCountries.includes(value?.toLowerCase() as SupportedCountry);
}

export function isSupportedLocale(
  value: string | undefined,
): value is SupportedLocale {
  return supportedLocales.includes(value?.toLowerCase() as SupportedLocale);
}

export function normalizeCountry(
  value: string | undefined,
  fallback: SupportedCountry = defaultCountry,
): SupportedCountry {
  const normalized = value?.toLowerCase();
  return isSupportedCountry(normalized) ? normalized : fallback;
}

export function normalizeLocale(
  value: string | undefined,
  fallback: SupportedLocale = defaultLocale,
): SupportedLocale {
  const normalized = value?.toLowerCase();
  return isSupportedLocale(normalized) ? normalized : fallback;
}

export function getHtmlLang(value: string | undefined): "en" | "zh-CN" {
  return normalizeLocale(value) === "zh" ? "zh-CN" : "en";
}
