import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeHero } from "@/components/home/HomeHero";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) =>
    ({
      heroTitle: "CenWatch.",
      heroSubtitle: "Air touch control, right from your wrist.",
    })[key] ?? key,
}));

describe("HomeHero", () => {
  it("renders the CenWatch product visual beside the hero copy", async () => {
    render(await HomeHero({ locale: "en" }));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "CenWatch. Air touch control, right from your wrist.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "CenWatch watches" }),
    ).toHaveAttribute("src", "/cenwatch/hero-watches.png");
    expect(screen.getByRole("img", { name: "CenWatch watches" })).toHaveClass(
      "max-h-[260px]",
      "md:max-h-[300px]",
      "lg:max-h-[340px]",
    );
    expect(
      screen.getByRole("img", { name: "CenWatch watches" }).closest("section"),
    ).toHaveClass("pt-8", "pb-6", "md:pt-10", "md:pb-8");
  });
});
