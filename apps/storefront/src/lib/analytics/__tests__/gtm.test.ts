import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSendGTMEvent } = vi.hoisted(() => ({
  mockSendGTMEvent: vi.fn(),
}));

vi.mock("@next/third-parties/google", () => ({
  sendGTMEvent: mockSendGTMEvent,
}));

import { trackAddToCart } from "@/lib/analytics/gtm";

describe("trackAddToCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports a variant identifier, quantity, and value for the added product", () => {
    trackAddToCart(
      {
        id: "product-1",
        name: "CenWatch Air",
        default_variant_id: "variant-1",
        price: { amount: "249.50" },
      } as never,
      {
        id: "variant-1",
        sku: "CWA-001",
        options_text: "Color: Black",
        price: { amount: "249.50" },
      } as never,
      2,
      "USD",
    );

    expect(mockSendGTMEvent).toHaveBeenNthCalledWith(1, {
      ecommerce: null,
    });
    expect(mockSendGTMEvent).toHaveBeenNthCalledWith(2, {
      event: "add_to_cart",
      ecommerce: {
        currency: "USD",
        value: 499,
        items: [
          {
            item_id: "CWA-001",
            item_name: "CenWatch Air",
            item_variant: "Color: Black",
            price: 249.5,
            quantity: 2,
          },
        ],
      },
    });
  });
});
