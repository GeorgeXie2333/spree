import { loadStripe } from "@stripe/stripe-js";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

/** Whether Stripe is configured (publishable key present in env). */
export const isStripeConfigured = Boolean(stripePublishableKey);

/** Whether the configured Stripe publishable key targets a test account. */
export function isStripeTestMode(
  publishableKey: string | undefined = stripePublishableKey,
): boolean {
  return publishableKey?.startsWith("pk_test_") ?? false;
}

export const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : Promise.resolve(null);
