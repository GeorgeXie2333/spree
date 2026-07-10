import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { resendSend } = vi.hoisted(() => ({
  resendSend: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: resendSend };
  },
}));

describe("sendEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("RESEND_API_KEY", "re_test_123");
    resendSend.mockReset().mockResolvedValue({ data: { id: "email_123" } });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("forwards the idempotency key to Resend", async () => {
    const { sendEmail } = await import("@/lib/emails/send");

    await sendEmail({
      to: "customer@example.com",
      from: "CenWatch <orders@cenwatch.com>",
      subject: "Order confirmation",
      react: createElement("p", null, "Thanks"),
      idempotencyKey: "spree-webhook-evt_123",
    });

    expect(resendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "customer@example.com",
        subject: "Order confirmation",
      }),
      { idempotencyKey: "spree-webhook-evt_123" },
    );
  });
});
