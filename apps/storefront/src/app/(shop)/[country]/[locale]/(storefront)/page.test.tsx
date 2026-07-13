import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "./page";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

vi.mock("@/components/home/HomeHero", () => ({
  HomeHero: () => <section data-testid="home-hero" />,
}));

vi.mock("@/components/home/HomeCategoryRail", () => ({
  HomeCategoryRail: () => <section data-testid="home-category-rail" />,
}));

vi.mock("@/components/home/HomeProductRail", () => ({
  HomeProductRail: ({ listId }: { listId: string }) => (
    <section data-testid={`product-rail-${listId}`} />
  ),
}));

vi.mock("@/components/home/HomePromos", () => ({
  HomePromos: () => <section data-testid="home-promos" />,
}));

vi.mock("@/components/home/HomeTrust", () => ({
  HomeTrust: () => <section data-testid="home-trust" />,
}));

describe("HomePage", () => {
  it("omits the category navigation and most-popular product rail", async () => {
    render(
      await HomePage({
        params: Promise.resolve({ country: "us", locale: "en" }),
      }),
    );

    expect(screen.queryByTestId("home-category-rail")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("product-rail-home-best-sellers"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("product-rail-home-new-arrivals"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("home-promos")).toBeInTheDocument();
    expect(screen.getByTestId("home-trust")).toBeInTheDocument();
  });
});
