"use server";

import type { Order } from "@spree/sdk";
import { updateTag } from "next/cache";
import { getCartOptions, getClient, requireCartId } from "@/lib/spree";
import { getCart } from "./cart";
import { getOrder } from "./orders";
import { actionResult } from "./utils";

export async function createCheckoutPaymentSession(
  cartId: string,
  paymentMethodId: string,
  externalData?: Record<string, unknown>,
) {
  return actionResult(async () => {
    const options = await getCartOptions();
    const id = await requireCartId();
    const session = await getClient().carts.paymentSessions.create(
      id,
      {
        payment_method_id: paymentMethodId,
        ...(externalData && { external_data: externalData }),
      },
      options,
    );
    updateTag("checkout");
    return { session };
  }, "Failed to create payment session");
}

/**
 * Creates a direct payment for non-session payment methods
 * (e.g. Check, Cash on Delivery, Bank Transfer).
 */
export async function createDirectPayment(
  cartId: string,
  paymentMethodId: string,
) {
  return actionResult(async () => {
    const options = await getCartOptions();
    const id = await requireCartId();
    const payment = await getClient().carts.payments.create(
      id,
      { payment_method_id: paymentMethodId },
      options,
    );
    updateTag("checkout");
    return { payment };
  }, "Failed to create payment");
}

export async function completeCheckoutPaymentSession(
  cartId: string,
  sessionId: string,
  params?: { session_result?: string; external_data?: Record<string, unknown> },
) {
  return actionResult(async () => {
    const options = await getCartOptions();
    const id = await requireCartId();
    const session = await getClient().carts.paymentSessions.complete(
      id,
      sessionId,
      params,
      options,
    );
    updateTag("checkout");
    return { session };
  }, "Failed to complete payment session");
}

/**
 * Complete the order. If the completion response is lost after the backend
 * commits, a completed-order lookup provides an idempotent recovery path.
 * HTTP status alone is never proof that checkout completed.
 */
export async function completeCheckoutOrder(cartId: string) {
  try {
    const options = await getCartOptions();
    const order: Order = await getClient().carts.complete(cartId, options);
    updateTag("checkout");
    updateTag("cart");
    return { success: true as const, order };
  } catch (error: unknown) {
    const completedOrder = await getOrder(cartId);
    if (completedOrder) {
      updateTag("checkout");
      updateTag("cart");
      return { success: true as const, order: completedOrder };
    }

    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to complete order",
    };
  }
}

/**
 * Confirms payment and completes the order after returning from an offsite
 * payment gateway (e.g. CashApp, 3D Secure).
 */
export async function confirmPaymentAndCompleteCart(
  cartId: string,
  sessionId?: string,
  sessionResult?: string,
): Promise<
  { success: true; order: unknown } | { success: false; error: string }
> {
  try {
    // Use explicit cartId — cookies may have been cleared during offsite redirect
    const cart = await getCart(cartId);
    if (!cart) {
      // Cart not found — the order may already be completed (e.g. by webhook).
      // Only a real completed order is proof that checkout succeeded.
      const completedOrder = await getOrder(cartId);
      return completedOrder
        ? { success: true, order: completedOrder }
        : {
            success: false,
            error: "Unable to verify that the order was completed.",
          };
    }

    if (cart.current_step === "complete") {
      return { success: true, order: cart };
    }

    if (sessionId) {
      const options = await getCartOptions();
      const id = await requireCartId();
      const completeResult = await getClient().carts.paymentSessions.complete(
        id,
        sessionId,
        sessionResult ? { session_result: sessionResult } : undefined,
        options,
      );
      if (completeResult.status === "failed") {
        return {
          success: false,
          error: "Payment was not successful. Please try again.",
        };
      }
    }

    const result = await completeCheckoutOrder(cartId);
    if (result.success) {
      return { success: true, order: result.order };
    }
    return { success: false, error: result.error };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to confirm payment. Please try again.",
    };
  }
}
