import enMessages from "../../../messages/en.json";
import zhMessages from "../../../messages/zh.json";
import { normalizeLocale } from "./routing";

export type LocaleMessageValues = Record<string, string | number>;

const messagesByLocale = {
  en: enMessages,
  zh: zhMessages,
} as const;

export function getLocaleMessage(
  locale: string | null | undefined,
  key: string,
  values: LocaleMessageValues = {},
): string {
  const messages = messagesByLocale[normalizeLocale(locale ?? undefined)];
  const message = key.split(".").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[segment];
  }, messages);

  if (typeof message !== "string") return key;

  return message.replace(/\{(\w+)\}/g, (placeholder, name) => {
    const value = values[name];
    return value === undefined ? placeholder : String(value);
  });
}
