import { describe, expect, it, vi } from "vitest";
import { FeaturedProducts } from "@/components/products/FeaturedProducts";
import { cachedListProducts } from "@/lib/data/products";

vi.mock("@/lib/data/products", () => ({
  cachedListProducts: vi.fn(),
}));

vi.mock("@/lib/spree", () => ({
  getAccessToken: vi.fn().mockResolvedValue(undefined),
}));

describe("FeaturedProducts", () => {
  it("renders an empty carousel instead of failing when the Store API is unavailable", async () => {
    vi.mocked(cachedListProducts).mockRejectedValueOnce(new Error("api down"));

    await expect(
      FeaturedProducts({
        basePath: "/us/en",
        locale: "en",
        country: "us",
      }),
    ).resolves.toBeTruthy();
  });
});
