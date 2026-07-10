import { describe, expect, it } from "vitest";
import { isStripeTestMode } from "@/lib/utils/stripe";

describe("isStripeTestMode", () => {
  it("recognizes Stripe test publishable keys", () => {
    expect(isStripeTestMode("pk_test_123")).toBe(true);
  });

  it("does not treat live or missing keys as test mode", () => {
    expect(isStripeTestMode("pk_live_123")).toBe(false);
    expect(isStripeTestMode(undefined)).toBe(false);
  });
});
