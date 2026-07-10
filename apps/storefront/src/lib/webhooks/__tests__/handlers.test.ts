import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendEmail } = vi.hoisted(() => ({
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/emails/send", () => ({ sendEmail }));

import { handlePasswordReset } from "@/lib/webhooks/handlers";

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
});
