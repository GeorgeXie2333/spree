import { isSupportedLocale, supportedLocales } from "@/lib/i18n/routing";
import { en } from "./en";
import type { CenwatchContent, CenwatchLocale } from "./types";
import { zh } from "./zh";

export type { CenwatchContent, CenwatchLocale } from "./types";

export const supportedCenwatchLocales = supportedLocales;

const contentByLocale: Record<CenwatchLocale, CenwatchContent> = {
  en,
  zh,
};

export function isCenwatchLocale(locale: string): locale is CenwatchLocale {
  return isSupportedLocale(locale);
}

export function getCenwatchContent(locale: string): CenwatchContent {
  return isCenwatchLocale(locale) ? contentByLocale[locale] : en;
}
