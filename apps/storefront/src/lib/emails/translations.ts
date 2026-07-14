import {
  getLocaleMessage,
  type LocaleMessageValues,
} from "@/lib/i18n/messages";

export type EmailTranslations = (
  key: string,
  values?: LocaleMessageValues,
) => string;

export function getEmailTranslations(
  locale?: string | null,
): EmailTranslations {
  return (key, values) => getLocaleMessage(locale, `emails.${key}`, values);
}
