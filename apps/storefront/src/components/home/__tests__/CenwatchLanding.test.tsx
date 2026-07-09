import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getCenwatchContent } from "@/content/cenwatch";
import { CenwatchLanding } from "../CenwatchLanding";

describe("CenwatchLanding", () => {
  it("renders the CenWatch landing story with localized commerce links and local media", () => {
    const content = getCenwatchContent("en");

    render(<CenwatchLanding basePath="/us/en" content={content} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: content.hero.title,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(content.hero.stats[0].value)).toBeInTheDocument();
    expect(screen.getByText(content.sections.tech.title)).toBeInTheDocument();
    expect(
      screen.getByText(content.sections.compatibility.platforms[0]),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: content.sections.comparison.title,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: content.sections.specs.title,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: content.sections.faq.title,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: content.hero.primaryCta }),
    ).toHaveAttribute("href", "/us/en/products");
    expect(
      screen.getByRole("link", { name: content.hero.secondaryCta }),
    ).toHaveAttribute("href", "/us/en/operation-instructions");

    expect(screen.getByAltText("CenWatch air touch hero")).toHaveAttribute(
      "src",
      content.hero.image,
    );
    expect(screen.getByAltText("CenWatch LiDAR gesture plane")).toHaveAttribute(
      "src",
      content.sections.tech.image,
    );

    for (const product of content.products) {
      expect(
        screen.getByRole("link", { name: `Shop ${product.name}` }),
      ).toHaveAttribute("href", "/us/en/products");
    }

    expect(screen.queryByText("$299.00 USD")).not.toBeInTheDocument();
  });
});
