import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAddItem, mockTrackAddToCart, mockTrackViewItem } = vi.hoisted(
  () => ({
    mockAddItem: vi.fn(),
    mockTrackAddToCart: vi.fn(),
    mockTrackViewItem: vi.fn(),
  }),
);

vi.mock("@/contexts/CartContext", () => ({
  useCart: () => ({ addItem: mockAddItem, cart: null }),
}));

vi.mock("@/contexts/StoreContext", () => ({
  useStore: () => ({ currency: "USD" }),
}));

vi.mock("@/lib/analytics/gtm", () => ({
  trackAddToCart: mockTrackAddToCart,
  trackViewItem: mockTrackViewItem,
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

import { ProductDetails } from "./ProductDetails";

const defaultVariant = {
  id: "variant-1",
  sku: "CWA-001",
  purchasable: true,
  in_stock: true,
  option_values: [],
  price: { amount: "249.50", display_amount: "$249.50" },
};

const product = {
  id: "product-1",
  name: "CenWatch Air",
  purchasable: true,
  in_stock: true,
  default_variant_id: "variant-1",
  default_variant: defaultVariant,
  variants: [],
  option_types: [],
  media: [],
  price: { amount: "249.50", display_amount: "$249.50" },
} as never;

function renderProductDetails() {
  return render(<ProductDetails product={product} basePath="/us/en" />);
}

describe("ProductDetails add to cart analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
  });

  it("does not report add_to_cart when the server rejects the mutation", async () => {
    mockAddItem.mockResolvedValue({ success: false, error: "Out of stock" });
    const user = userEvent.setup();

    renderProductDetails();
    await user.click(screen.getAllByRole("button", { name: "addToCart" })[0]);

    expect(mockAddItem).toHaveBeenCalledWith("variant-1", 1);
    expect(mockTrackAddToCart).not.toHaveBeenCalled();
  });

  it("reports the confirmed product, variant, and selected quantity", async () => {
    mockAddItem.mockResolvedValue({ success: true, cart: { id: "cart-1" } });
    const user = userEvent.setup();

    renderProductDetails();
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    await user.click(screen.getAllByRole("button", { name: "addToCart" })[0]);

    expect(mockAddItem).toHaveBeenCalledWith("variant-1", 2);
    expect(mockTrackAddToCart).toHaveBeenCalledWith(
      product,
      defaultVariant,
      2,
      "USD",
    );
  });
});
