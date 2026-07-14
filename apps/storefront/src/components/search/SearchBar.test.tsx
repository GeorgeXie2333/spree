import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchBar } from "./SearchBar";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/contexts/StoreContext", () => ({
  useStore: () => ({ currency: "USD" }),
}));

vi.mock("@/lib/data/products", () => ({
  getProducts: vi.fn(),
}));

vi.mock("@/lib/analytics/gtm", () => ({
  trackQuickSearch: vi.fn(),
  trackSelectItem: vi.fn(),
}));

describe("SearchBar", () => {
  it("anchors suggestions to the search field instead of the viewport", () => {
    render(<SearchBar basePath="/us/en" />);

    fireEvent.change(screen.getByRole("combobox", { name: "search" }), {
      target: { value: "ce" },
    });

    const suggestions = screen.getByTestId("search-suggestions");
    expect(suggestions).toHaveClass("absolute", "inset-x-0", "top-full");
    expect(suggestions).not.toHaveClass("fixed");
  });
});
