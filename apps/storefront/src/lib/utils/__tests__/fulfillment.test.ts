import type { Order } from "@spree/sdk";
import { describe, expect, it } from "vitest";
import { buildFulfillmentLineItems } from "../fulfillment";

const splitOrder = {
  items: [
    {
      id: "line-item-1",
      quantity: 3,
      currency: "USD",
      name: "CenWatch Air",
      total: "10.00",
      display_total: "$10.00",
    },
  ],
  fulfillments: [
    {
      id: "fulfillment-1",
      items: [{ item_id: "line-item-1", variant_id: "variant-1", quantity: 1 }],
    },
    {
      id: "fulfillment-2",
      items: [{ item_id: "line-item-1", variant_id: "variant-1", quantity: 2 }],
    },
  ],
} as unknown as Order;

describe("buildFulfillmentLineItems", () => {
  it("uses manifest quantities and allocates each line total across partial fulfillments", () => {
    const lineItemsByFulfillment = buildFulfillmentLineItems(
      splitOrder,
      "en-US",
    );
    const firstShipment = lineItemsByFulfillment.get("fulfillment-1");
    const secondShipment = lineItemsByFulfillment.get("fulfillment-2");

    expect(firstShipment).toMatchObject([
      { item: { id: "line-item-1" }, quantity: 1, total: "3.34" },
    ]);
    expect(secondShipment).toMatchObject([
      { item: { id: "line-item-1" }, quantity: 2, total: "6.66" },
    ]);
    expect(firstShipment?.[0].displayTotal).toBe("$3.34");
    expect(secondShipment?.[0].displayTotal).toBe("$6.66");

    const fulfilledQuantity = [firstShipment, secondShipment]
      .flatMap((items) => items ?? [])
      .reduce((total, item) => total + item.quantity, 0);
    expect(fulfilledQuantity).toBe(splitOrder.items[0].quantity);
  });
});
