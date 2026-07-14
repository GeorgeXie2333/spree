import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mkdirSync, renderEmail, resendSend, writeFileSync } = vi.hoisted(
  () => ({
    mkdirSync: vi.fn(),
    renderEmail: vi.fn(),
    resendSend: vi.fn(),
    writeFileSync: vi.fn(),
  }),
);

vi.mock("node:fs", () => ({
  default: { mkdirSync, writeFileSync },
}));

vi.mock("@react-email/render", () => ({ render: renderEmail }));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: resendSend };
  },
}));

describe("sendEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "re_test_123");
    mkdirSync.mockReset();
    renderEmail.mockReset();
    resendSend.mockReset().mockResolvedValue({ data: { id: "email_123" } });
    writeFileSync.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
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

  it("writes a local preview in development without Resend configuration", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("RESEND_API_KEY", "");
    renderEmail.mockResolvedValue("<p>Preview</p>");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const { sendEmail } = await import("@/lib/emails/send");

    await sendEmail({
      to: "customer@example.com",
      subject: "Order confirmation",
      react: createElement("p", null, "Thanks"),
    });

    expect(renderEmail).toHaveBeenCalledOnce();
    expect(mkdirSync).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      "<p>Preview</p>",
    );
    expect(resendSend).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("fails retryably in production without Resend configuration and never writes a preview", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "");
    const { sendEmail } = await import("@/lib/emails/send");

    await expect(
      sendEmail({
        to: "customer@example.com",
        subject: "Order confirmation",
        react: createElement("p", null, "Thanks"),
      }),
    ).rejects.toMatchObject({ name: "EmailDeliveryError", retryable: true });

    expect(renderEmail).not.toHaveBeenCalled();
    expect(mkdirSync).not.toHaveBeenCalled();
    expect(writeFileSync).not.toHaveBeenCalled();
    expect(resendSend).not.toHaveBeenCalled();
  });
});
