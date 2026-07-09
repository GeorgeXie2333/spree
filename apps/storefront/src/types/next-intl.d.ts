import type messages from "../../messages/en.json";

type Messages = typeof messages;

declare global {
  type Locale = "en" | "zh";
  interface IntlMessages extends Messages {}
}

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
  }
}
