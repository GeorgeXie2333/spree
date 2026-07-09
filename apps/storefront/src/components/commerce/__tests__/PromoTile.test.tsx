import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PromoTile } from "@/components/commerce/PromoTile";

describe("PromoTile", () => {
  it("uses a compact tile height and full-width body copy", () => {
    render(
      <PromoTile
        title="Explore CenWatch."
        text="Compare models and find the air touch watch that fits your day."
        ctaLabel="View CenWatch"
        href="/us/en/products"
      />,
    );

    const tile = screen.getByRole("heading", {
      level: 3,
      name: "Explore CenWatch.",
    }).parentElement;
    const copy = screen.getByText(
      "Compare models and find the air touch watch that fits your day.",
    );

    expect(tile).toHaveClass("min-h-44", "p-6", "md:p-8");
    expect(tile).not.toHaveClass("min-h-72");
    expect(copy).toHaveClass("max-w-none");
  });
});
