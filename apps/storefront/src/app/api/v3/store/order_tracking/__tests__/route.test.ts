import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../route";

const originalEnv = process.env.ORDER_TRACKING_API_URL;

function jsonRequest(body: unknown) {
  return new Request("https://shop.cenwatch.com/api/v3/store/order_tracking", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("order tracking API", () => {
  afterEach(() => {
    process.env.ORDER_TRACKING_API_URL = originalEnv;
    vi.restoreAllMocks();
  });

  it("returns a generic failure when no private tracking backend is configured", async () => {
    delete process.env.ORDER_TRACKING_API_URL;

    const response = await POST(
      jsonRequest({ order_number: "R123456789", email: "buyer@example.com" }),
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      ok: false,
      message: "Order tracking is temporarily unavailable.",
    });
  });

  it("sanitizes successful backend responses to limited tracking fields", async () => {
    process.env.ORDER_TRACKING_API_URL =
      "https://api.cenwatch.com/api/v3/store/order_tracking";
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          order_number: "R123456789",
          order_status: "complete",
          payment_state: "paid",
          shipment_state: "shipped",
          email: "buyer@example.com",
          total: "$299",
          shipments: [
            {
              status: "shipped",
              tracking_number: "TRACK123",
              tracking_url: "https://carrier.example/track/TRACK123",
              carrier: "Carrier",
              private_note: "do not leak",
            },
          ],
        }),
      ),
    );

    const response = await POST(
      jsonRequest({ order_number: "R123456789", email: "buyer@example.com" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      order_number: "R123456789",
      order_status: "complete",
      payment_state: "paid",
      shipment_state: "shipped",
      shipments: [
        {
          status: "shipped",
          tracking_number: "TRACK123",
          tracking_url: "https://carrier.example/track/TRACK123",
          carrier: "Carrier",
        },
      ],
    });
  });

  it("maps upstream misses to a generic failure", async () => {
    process.env.ORDER_TRACKING_API_URL =
      "https://api.cenwatch.com/api/v3/store/order_tracking";
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: false }), { status: 404 }),
    );

    const response = await POST(
      jsonRequest({ order_number: "R123456789", email: "wrong@example.com" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(false);
    expect(body.message).toBe(
      "We could not find an order matching those details.",
    );
  });
});
