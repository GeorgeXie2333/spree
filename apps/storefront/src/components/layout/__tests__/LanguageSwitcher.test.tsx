import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLocaleSwitch } from "@/hooks/useLocaleSwitch";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({
      selectLanguage: "Select Language",
    })[key] ?? key,
}));

vi.mock("@/contexts/StoreContext", () => ({
  useStore: () => ({
    country: "us",
    locale: "zh",
    currency: "USD",
    countries: [],
    loading: false,
  }),
}));

vi.mock("@/hooks/useLocaleSwitch", () => ({
  useLocaleSwitch: vi.fn(() => ({
    isLocaleNavigating: false,
    handleLocaleSelect: vi.fn(),
  })),
}));

describe("LanguageSwitcher", () => {
  it("renders a separate language capsule for the active locale", () => {
    render(<LanguageSwitcher />);

    expect(
      screen.getByRole("button", { name: "Select Language: 简体中文" }),
    ).toHaveTextContent("中文");
    expect(useLocaleSwitch).toHaveBeenCalledWith({
      currentCountry: "us",
      currentLocale: "zh",
      currency: "USD",
    });
  });
});
