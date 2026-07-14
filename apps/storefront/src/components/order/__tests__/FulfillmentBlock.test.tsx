import type { Fulfillment, Order } from "@spree/sdk";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FulfillmentBlock } from "../FulfillmentBlock";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { quantity?: number }) =>
    key === "qty" ? `Qty: ${values?.quantity}` : key,
}));

const lineItem = {
  id: "line-item-1",
  slug: "cenwatch-air",
  name: "CenWatch Air",
  quantity: 3,
  display_price: "$12.00",
  display_total: "$30.00",
  thumbnail_url: null,
} as unknown as Order["items"][number];

const fulfillment = {
  id: "fulfillment-1",
  status: "shipped",
  tracking_url: null,
  delivery_method: { name: "Standard Shipping" },
} as unknown as Fulfillment;

describe("FulfillmentBlock", () => {
  it("renders the manifest quantity and allocated total instead of the full line item", () => {
    render(
      <FulfillmentBlock
        fulfillment={fulfillment}
        shipAddress={null}
        basePath="/us/en"
        lineItems={[
          {
            item: lineItem,
            quantity: 1,
            total: "10.00",
            displayTotal: "$10.00",
          },
        ]}
      />,
    );

    expect(screen.getByText("Qty: 1")).toBeInTheDocument();
    expect(screen.getByText("$10.00")).toBeInTheDocument();
    expect(screen.queryByText("Qty: 3")).not.toBeInTheDocument();
    expect(screen.queryByText("$30.00")).not.toBeInTheDocument();
  });
});
