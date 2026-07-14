import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendEmail } = vi.hoisted(() => ({
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/emails/send", () => ({ sendEmail }));

import {
  handleOrderCompleted,
  handlePasswordReset,
} from "@/lib/webhooks/handlers";

describe("webhook email handlers", () => {
  beforeEach(() => {
    sendEmail.mockReset().mockResolvedValue(undefined);
  });

  it("uses the Spree event ID as the email idempotency key", async () => {
    await handlePasswordReset({
      id: "evt_123",
      name: "customer.password_reset_requested",
      data: {
        email: "customer@example.com",
        reset_token: "reset_123",
        redirect_url: "https://shop.cenwatch.com/us/en/account/reset-password",
      },
    } as never);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "customer@example.com",
        idempotencyKey: "spree-webhook-evt_123",
      }),
    );
  });

  it("uses the reset URL locale for the password reset subject", async () => {
    await handlePasswordReset({
      id: "evt_zh_reset",
      name: "customer.password_reset_requested",
      data: {
        email: "customer@example.com",
        reset_token: "reset_zh",
        redirect_url: "https://shop.cenwatch.com/us/zh/account/reset-password",
      },
    } as never);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "CenWatch 重置密码" }),
    );
  });

  it("uses the order locale for confirmation subjects", async () => {
    await handleOrderCompleted({
      id: "evt_zh_order",
      name: "order.completed",
      data: {
        email: "customer@example.com",
        locale: "zh",
        number: "R100",
        items: [],
        fulfillments: [],
        display_item_total: "$10.00",
        display_delivery_total: "$0.00",
        display_tax_total: "$0.00",
        display_total: "$10.00",
      },
    } as never);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "CenWatch 订单确认 #R100" }),
    );
  });
});
