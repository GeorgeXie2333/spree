import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CountrySwitcher } from "@/components/layout/CountrySwitcher";
import { useCountrySwitch } from "@/hooks/useCountrySwitch";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { country?: string }) =>
    ({
      selectCountry: "Select Country",
      countryFlag: `${values?.country} flag`,
    })[key] ?? key,
}));

vi.mock("@/contexts/StoreContext", () => ({
  useStore: () => ({
    country: "us",
    locale: "zh",
    currency: "USD",
    countries: [
      {
        iso: "US",
        name: "United States",
        currency: "USD",
        default_locale: "en",
        marketId: "market-us",
      },
      {
        iso: "CA",
        name: "Canada",
        currency: "USD",
        default_locale: "en",
        marketId: "market-ca",
      },
    ],
    loading: false,
  }),
}));

vi.mock("@/hooks/useCountrySwitch", () => ({
  useCountrySwitch: vi.fn(() => ({
    isCountryNavigating: false,
    handleCountrySelect: vi.fn(),
  })),
}));

describe("CountrySwitcher", () => {
  it("uses jsDelivr flag icons instead of emoji flags", () => {
    render(<CountrySwitcher />);

    expect(screen.getByAltText("US flag")).toHaveAttribute(
      "src",
      "https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/us.svg",
    );
    expect(useCountrySwitch).toHaveBeenCalledWith({
      currentCountry: "us",
      currentLocale: "zh",
    });
  });
});
