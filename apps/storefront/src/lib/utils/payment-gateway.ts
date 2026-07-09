import type { PaymentMethod } from "@spree/sdk";

export type GatewayId = "stripe" | "unknown";

export function resolveGatewayId(paymentMethodType: string): GatewayId {
  return paymentMethodType === "stripe" ||
    paymentMethodType === "SpreeStripe::Gateway"
    ? "stripe"
    : "unknown";
}

export function isStripePaymentMethod(paymentMethod: PaymentMethod): boolean {
  return (
    paymentMethod.session_required &&
    resolveGatewayId(paymentMethod.type) === "stripe"
  );
}
