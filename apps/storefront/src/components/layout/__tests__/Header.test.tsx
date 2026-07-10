import type { Category } from "@spree/sdk";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/dynamic", () => ({
  default: () => () => null,
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

vi.mock("@/lib/store", () => ({
  getStoreName: () => "CenWatch",
}));

vi.mock("@/components/layout/PromoBar", () => ({
  PromoBar: () => null,
}));

vi.mock("@/components/layout/CartButton", () => ({
  CartButton: () => null,
}));

vi.mock("@/components/layout/SearchToggle", () => ({
  SearchToggle: ({ left, center }: { left: ReactNode; center: ReactNode }) => (
    <div>
      {left}
      {center}
    </div>
  ),
}));

vi.mock("@/components/layout/CategoryNav", () => ({
  CategoryNav: () => (
    <nav>
      <a href="/us/en/products">CenWatch</a>
      <a href="/us/en/c/cenwatch">cenwatch</a>
    </nav>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const category = {
  id: "ctg_cenwatch",
  name: "cenwatch",
  permalink: "cenwatch",
  children: [],
} as unknown as Category;

describe("Header", () => {
  it("renders the brand without the desktop catalog navigation", async () => {
    const { Header } = await import("../Header");

    render(
      await Header({
        rootCategories: [category],
        basePath: "/us/en",
        locale: "en",
      }),
    );

    expect(screen.getAllByText("CenWatch")).toHaveLength(1);
    expect(screen.queryByText("cenwatch")).not.toBeInTheDocument();
  });
});
