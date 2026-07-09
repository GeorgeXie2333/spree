import type { PaymentMethod } from "@spree/sdk";
import { describe, expect, it } from "vitest";
import {
  isStripePaymentMethod,
  resolveGatewayId,
} from "@/lib/utils/payment-gateway";

function paymentMethod(type: string, sessionRequired = true): PaymentMethod {
  return {
    id: `payment-${type}`,
    name: type,
    description: null,
    type,
    session_required: sessionRequired,
    source_required: false,
  };
}

describe("CenWatch payment gateway selection", () => {
  it.each([
    "stripe",
    "SpreeStripe::Gateway",
  ])("recognizes the supported Stripe type %s", (type) => {
    expect(resolveGatewayId(type)).toBe("stripe");
    expect(isStripePaymentMethod(paymentMethod(type))).toBe(true);
  });

  it.each([
    "adyen",
    "paypal",
    "paypal_checkout",
    "Spree::Gateway::StripeGateway",
    "Spree::PaymentMethod::Check",
  ])("rejects non-Stripe type %s", (type) => {
    expect(resolveGatewayId(type)).toBe("unknown");
    expect(isStripePaymentMethod(paymentMethod(type))).toBe(false);
  });

  it("rejects non-session Stripe methods", () => {
    expect(isStripePaymentMethod(paymentMethod("stripe", false))).toBe(false);
  });
});
