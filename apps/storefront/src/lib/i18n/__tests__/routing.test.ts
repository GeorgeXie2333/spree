import { describe, expect, it } from "vitest";
import {
  getHtmlLang,
  normalizeCountry,
  normalizeLocale,
  supportedCountries,
  supportedLocales,
} from "@/lib/i18n/routing";

describe("CenWatch routing locale helpers", () => {
  it("keeps the launch country and locale list in one typed source", () => {
    expect(supportedCountries).toEqual(["us", "ca"]);
    expect(supportedLocales).toEqual(["en", "zh"]);
  });

  it("normalizes unsupported URL segments to the default route values", () => {
    expect(normalizeCountry("gb")).toBe("us");
    expect(normalizeLocale("fr")).toBe("en");
  });

  it("maps route locale to the server-rendered html lang value", () => {
    expect(getHtmlLang("en")).toBe("en");
    expect(getHtmlLang("zh")).toBe("zh-CN");
    expect(getHtmlLang("fr")).toBe("en");
  });
});
