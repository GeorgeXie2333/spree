import { describe, expect, it } from "vitest";
import {
  getCenwatchContent,
  supportedCenwatchLocales,
} from "@/content/cenwatch";

describe("CenWatch content", () => {
  it("supports the launch locales without exposing legacy platform copy", () => {
    expect(supportedCenwatchLocales).toEqual(["en", "zh"]);

    for (const locale of supportedCenwatchLocales) {
      const content = getCenwatchContent(locale);
      const serialized = JSON.stringify(content).toLowerCase();

      expect(content.brand.name).toBe("CenWatch");
      expect(content.navigation).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ href: "/products" }),
          expect.objectContaining({ href: "/operation-instructions" }),
          expect.objectContaining({ href: "/contact" }),
          expect.objectContaining({ href: "/order-tracking" }),
        ]),
      );
      expect(content.products).toHaveLength(3);
      expect(serialized).toContain("lidar");
      expect(serialized).not.toContain("shopify");
      expect(serialized).not.toContain("kickstarter");
    }
  });

  it("falls back to English for unsupported locales", () => {
    expect(getCenwatchContent("de")).toBe(getCenwatchContent("en"));
  });
});
