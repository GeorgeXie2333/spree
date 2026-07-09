import { describe, expect, it } from "vitest";
import {
  getCenwatchLaunchCountryLocales,
  getCenwatchLaunchMarkets,
} from "@/lib/cenwatch/markets";

describe("CenWatch launch markets", () => {
  it("defines the launch US and Canada USD market without a Spree API call", () => {
    const markets = getCenwatchLaunchMarkets();

    expect(markets).toHaveLength(1);
    expect(markets[0]).toMatchObject({
      currency: "USD",
      default_locale: "en",
      supported_locales: ["en", "zh"],
    });
    expect(markets[0].countries?.map((country) => country.iso)).toEqual([
      "US",
      "CA",
    ]);
  });

  it("prepares static route locale pairs for every launch country", () => {
    expect(getCenwatchLaunchCountryLocales()).toEqual([
      { country: "us", locale: "en" },
      { country: "us", locale: "zh" },
      { country: "ca", locale: "en" },
      { country: "ca", locale: "zh" },
    ]);
  });
});
