import { describe, expect, it, vi } from "vitest";
import { EmailDeliveryError } from "@/lib/emails/send";
import { createWebhookHandler } from "@/lib/spree/webhooks";

const verifyWebhookSignature = vi.hoisted(() => vi.fn(() => true));

vi.mock("@spree/sdk/webhooks", () => ({
  verifyWebhookSignature,
}));

describe("createWebhookHandler", () => {
  it("does not acknowledge a webhook when an email delivery failure is retryable", async () => {
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = createWebhookHandler({
      secret: "webhook-secret",
      handlers: {
        "order.completed": async () => {
          throw new EmailDeliveryError("RESEND_API_KEY is missing");
        },
      },
    });

    const response = await handler(
      new Request("https://storefront.example/api/webhooks/spree", {
        method: "POST",
        headers: {
          "x-spree-webhook-signature": "signature",
          "x-spree-webhook-timestamp": "1700000000",
          "x-spree-webhook-event": "order.completed",
        },
        body: JSON.stringify({ id: "event-1", name: "order.completed" }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Handler failed" });
    logError.mockRestore();
  });
});
