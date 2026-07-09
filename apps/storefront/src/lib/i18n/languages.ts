import { type SupportedLocale, supportedLocales } from "@/lib/i18n/routing";

export interface LanguageOption {
  locale: SupportedLocale;
  label: string;
  shortLabel: string;
}

export const languageOptions: LanguageOption[] = supportedLocales.map(
  (locale) =>
    locale === "zh"
      ? { locale, label: "简体中文", shortLabel: "中文" }
      : { locale, label: "English", shortLabel: "EN" },
);

export function getLanguageOption(locale: string): LanguageOption {
  return (
    languageOptions.find((option) => option.locale === locale.toLowerCase()) ??
    languageOptions[0]
  );
}
