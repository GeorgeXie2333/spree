"use client";

import type { Cart } from "@spree/sdk";
import {
  Elements,
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type {
  StripeExpressCheckoutElementClickEvent,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementReadyEvent,
  StripeExpressCheckoutElementShippingAddressChangeEvent,
  StripeExpressCheckoutElementShippingRateChangeEvent,
} from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PolicyConsent } from "@/components/policy/PolicyConsent";
import { useAuth } from "@/contexts/AuthContext";
import {
  expressCheckoutCreateSession,
  expressCheckoutFinalize,
  expressCheckoutPreparePayment,
  expressCheckoutResolveShipping,
  expressCheckoutSelectRates,
} from "@/lib/data/express-checkout-flow";
import { cn } from "@/lib/utils";
import { cacheCompletedOrder } from "@/lib/utils/completed-order-cache";
import {
  buildLineItems,
  buildShippingRateMap,
  buildSpreeAddress,
  parseName,
} from "@/lib/utils/express-checkout";
import { isStripeConfigured, stripePromise } from "@/lib/utils/stripe";

export interface ExpressCheckoutButtonProps {
  cart: Cart;
  basePath: string;
  onComplete: () => void | Promise<void>;
  onProcessingChange?: (processing: boolean) => void;
  onAvailabilityChange?: (available: boolean) => void;
  maxColumns?: number;
  showDivider?: boolean;
  requiresPolicyConsent?: boolean;
  policyConsent?: boolean;
  showPolicyConsent?: boolean;
}

interface ExpressCheckoutResolvedProps extends ExpressCheckoutButtonProps {
  requiresPolicyConsent: boolean;
  policyConsent: boolean;
  onPolicyConsentChange: (checked: boolean) => void;
  showPolicyConsent: boolean;
}

function ExpressCheckoutInner({
  cart,
  basePath,
  onComplete,
  onProcessingChange,
  onAvailabilityChange,
  maxColumns = 1,
  showDivider = true,
  requiresPolicyConsent,
  policyConsent,
  onPolicyConsentChange,
  showPolicyConsent,
}: ExpressCheckoutResolvedProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const t = useTranslations("expressCheckout");
  const tc = useTranslations("checkout");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const isConfirmingRef = useRef(false);
  const isGooglePayRef = useRef(false);
  const shippingRateMapRef = useRef(
    new Map<string, Array<{ fulfillmentId: string; rateId: string }>>(),
  );
  const onProcessingChangeRef = useRef(onProcessingChange);
  onProcessingChangeRef.current = onProcessingChange;
  const onAvailabilityChangeRef = useRef(onAvailabilityChange);
  onAvailabilityChangeRef.current = onAvailabilityChange;

  const updateProcessing = useCallback((value: boolean) => {
    setProcessing(value);
    onProcessingChangeRef.current?.(value);
  }, []);

  // Sync amount with Elements when cart changes (without remounting).
  // Must use buildLineItems total (not just item_total) because the cart
  // may already include tax/discounts from a prior checkout attempt.
  const cartLineItemsAmount = useMemo(() => {
    const items = buildLineItems(cart);
    return items.reduce((sum, item) => sum + item.amount, 0);
  }, [cart]);

  useEffect(() => {
    if (!elements) return;
    try {
      elements.update({ amount: cartLineItemsAmount });
    } catch (_) {
      /* non-fatal */
    }
  }, [elements, cartLineItemsAmount]);

  const handleReady = useCallback(
    (event: StripeExpressCheckoutElementReadyEvent) => {
      const methods = event.availablePaymentMethods;
      console.log("[ExpressCheckout] availablePaymentMethods:", methods);
      const isAvailable =
        methods !== undefined &&
        (methods.applePay || methods.googlePay || methods.link);
      setAvailable(isAvailable);
      onAvailabilityChangeRef.current?.(isAvailable);
    },
    [],
  );

  const handleClick = useCallback(
    (event: StripeExpressCheckoutElementClickEvent) => {
      isGooglePayRef.current = event.expressPaymentType === "google_pay";
      event.resolve({
        lineItems: buildLineItems(cart),
      });
    },
    [cart],
  );

  const handleShippingAddressChange = useCallback(
    async (event: StripeExpressCheckoutElementShippingAddressChangeEvent) => {
      try {
        const { address } = event;
        const result = await expressCheckoutResolveShipping(cart.id, {
          city: address.city,
          postal_code: address.postal_code,
          country_iso: address.country,
          state_name: address.state || undefined,
        });

        if (!result.success) {
          event.reject();
          return;
        }

        const order = result.cart;

        const { shippingRates, selectionMap } = buildShippingRateMap(
          order.fulfillments || [],
          isGooglePayRef.current,
          order.currency,
        );
        shippingRateMapRef.current = selectionMap;

        if (shippingRates.length === 0) {
          event.reject();
          return;
        }

        const lineItems = buildLineItems(order);
        const defaultShippingAmount = shippingRates[0]?.amount ?? 0;
        lineItems.push({ name: t("shipping"), amount: defaultShippingAmount });

        const lineItemsSum = lineItems.reduce(
          (sum, item) => sum + item.amount,
          0,
        );

        // Amount must be updated BEFORE resolve — Stripe validates
        // that Elements amount >= sum(lineItems).
        if (!elements) throw new Error("Elements not available");
        elements.update({ amount: lineItemsSum });

        event.resolve({ shippingRates, lineItems });
      } catch (err) {
        console.error("[ExpressCheckout] shipping address error:", err);
        try {
          event.reject();
        } catch (_) {
          /* already resolved/rejected */
        }
      }
    },
    [cart.id, elements, t],
  );

  const handleShippingRateChange = useCallback(
    async (event: StripeExpressCheckoutElementShippingRateChangeEvent) => {
      try {
        const { shippingRate } = event;

        const selections = shippingRateMapRef.current.get(shippingRate.id);
        if (!selections || selections.length === 0) {
          event.reject();
          return;
        }

        const result = await expressCheckoutSelectRates(cart.id, selections);
        if (!result.success) {
          event.reject();
          return;
        }

        const lineItems = buildLineItems(result.cart);
        lineItems.push({ name: t("shipping"), amount: shippingRate.amount });
        const newAmount = lineItems.reduce((s, i) => s + i.amount, 0);

        if (!elements) throw new Error("Elements not available");
        elements.update({ amount: newAmount });

        event.resolve({ lineItems });
      } catch (_err) {
        try {
          event.reject();
        } catch (_) {
          /* already resolved/rejected */
        }
      }
    },
    [cart.id, elements, t],
  );

  const handleConfirm = useCallback(
    async (event: StripeExpressCheckoutElementConfirmEvent) => {
      if (isConfirmingRef.current) return;

      if (requiresPolicyConsent && !policyConsent) {
        setError(tc("policyConsentRequired"));
        event.paymentFailed({ reason: "fail" });
        return;
      }

      if (!stripe || !elements) {
        event.paymentFailed({ reason: "fail" });
        return;
      }

      isConfirmingRef.current = true;
      const orderId = cart.id;
      setError(null);
      updateProcessing(true);

      let stripePaymentConfirmed = false;

      const fail = (
        reason:
          | "fail"
          | "invalid_shipping_address"
          | "invalid_billing_address"
          | "invalid_payment_data"
          | "address_unserviceable",
        msg: string,
      ) => {
        if (!stripePaymentConfirmed) {
          event.paymentFailed({ reason });
        }
        setError(msg);
        updateProcessing(false);
        isConfirmingRef.current = false;
      };

      try {
        const billing = event.billingDetails;
        const shipping = event.shippingAddress;
        const email = billing?.email || "";
        const phone = billing?.phone || "";

        const shippingName = parseName(shipping?.name || billing?.name || "");
        const billingName = parseName(billing?.name || shipping?.name || "");

        const shipAddr = shipping?.address || billing?.address;
        const billAddr = billing?.address || shipping?.address;

        if (!shipAddr || !billAddr) {
          fail("invalid_shipping_address", t("missingAddress"));
          return;
        }

        const prepareResult = await expressCheckoutPreparePayment(orderId, {
          email,
          shipAddress: buildSpreeAddress(shippingName, shipAddr, phone),
          billAddress: buildSpreeAddress(billingName, billAddr, phone),
        });

        if (!prepareResult.success) {
          fail("invalid_shipping_address", prepareResult.error);
          return;
        }
        const advancedOrder = prepareResult.cart;

        const submitResult = await elements.submit();
        if (submitResult.error) {
          fail(
            "fail",
            submitResult.error.message || t("paymentSubmissionFailed"),
          );
          return;
        }

        const { error: pmError, paymentMethod } =
          await stripe.createPaymentMethod({ elements });
        if (pmError || !paymentMethod) {
          fail(
            "invalid_payment_data",
            pmError?.message || t("failedToCreatePaymentMethod"),
          );
          return;
        }

        const orderPaymentMethods =
          advancedOrder?.payment_methods ?? cart.payment_methods;
        const sessionPaymentMethod = orderPaymentMethods?.find(
          (pm) => pm.session_required,
        );
        if (!sessionPaymentMethod) {
          fail("fail", t("noPaymentMethodAvailable"));
          return;
        }

        const sessionResult = await expressCheckoutCreateSession(
          orderId,
          sessionPaymentMethod.id,
          paymentMethod.id,
        );

        if (!sessionResult.success || !sessionResult.session) {
          fail(
            "fail",
            !sessionResult.success
              ? sessionResult.error
              : t("failedToCreatePaymentSession"),
          );
          return;
        }

        const clientSecret = sessionResult.session.external_data
          ?.client_secret as string | undefined;
        const sessionId = sessionResult.session.id;

        if (!clientSecret) {
          fail("fail", t("failedToInitializePayment"));
          return;
        }

        const returnUrl = `${window.location.origin}${basePath}/confirm-payment/${orderId}?session=${sessionId}`;
        const { error: confirmError } = await stripe.confirmPayment({
          clientSecret,
          confirmParams: {
            payment_method: paymentMethod.id,
            return_url: returnUrl,
          },
          redirect: "if_required",
        });

        if (confirmError) {
          fail("fail", confirmError.message || t("paymentConfirmationFailed"));
          return;
        }
        stripePaymentConfirmed = true;

        try {
          const finalizeResult = await expressCheckoutFinalize(
            orderId,
            sessionId,
          );
          if (!finalizeResult.success) {
            fail("fail", finalizeResult.error);
            return;
          } else if (finalizeResult.order) {
            cacheCompletedOrder(orderId, finalizeResult.order);
          } else {
            fail("fail", t("orderCompletionUnconfirmed"));
            return;
          }
        } catch (completeErr) {
          fail(
            "fail",
            completeErr instanceof Error
              ? completeErr.message
              : t("finalizationFailed"),
          );
          return;
        }

        router.push(`${basePath}/order-placed/${orderId}`);
        try {
          await onComplete();
        } catch (_onCompleteErr) {
          /* onComplete failed — non-blocking, navigation already fired */
        } finally {
          isConfirmingRef.current = false;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : t("unexpectedError");
        fail("fail", msg);
      }
    },
    [
      stripe,
      elements,
      cart.id,
      cart.payment_methods,
      basePath,
      onComplete,
      router,
      updateProcessing,
      t,
      tc,
      requiresPolicyConsent,
      policyConsent,
    ],
  );

  const handleCancel = useCallback(() => {
    // No-op: placeholder address on cart doesn't persist to address book
    // and will be overwritten by next checkout attempt.
  }, []);

  if (available === false) return null;

  const walletDisabled = requiresPolicyConsent && !policyConsent;

  return (
    <div className="w-full">
      {available === true && requiresPolicyConsent && showPolicyConsent && (
        <div className="mb-3">
          <PolicyConsent
            id={`express-policy-consent-${cart.id}`}
            checked={policyConsent}
            onCheckedChange={onPolicyConsentChange}
          />
        </div>
      )}
      {/* Shared container — smoothly transitions between buttons and finalizing state */}
      <div className="relative overflow-hidden">
        {/* Finalizing overlay — fades in on top of the button area */}
        <div
          className={`absolute inset-0 z-10 flex flex-col items-center justify-center transition-opacity duration-500 ease-out ${
            processing ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="mt-4 text-sm font-medium text-foreground">
            {t("finalizingPayment")}
          </p>
        </div>

        {/* Buttons area — min-h keeps space, content fades out when processing */}
        <div className="relative min-h-12">
          {/* Spinner — overlays the button area, fades out when ready */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
              available === null && !processing
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>

          {/* Buttons — always mounted so Stripe can init, fade in when ready */}
          <div
            inert={walletDisabled ? true : undefined}
            aria-disabled={walletDisabled}
            className={cn(
              "transition-opacity duration-300 ease-out",
              available === true && !processing ? "opacity-100" : "opacity-0",
              walletDisabled && "pointer-events-none opacity-50",
            )}
          >
            <ExpressCheckoutElement
              options={{
                paymentMethods: {
                  applePay: "auto",
                  googlePay: "auto",
                  link: "auto",
                },
                buttonType: {
                  applePay: "check-out",
                  googlePay: "checkout",
                },
                buttonTheme: {
                  applePay: "black",
                  googlePay: "black",
                },
                layout: {
                  maxColumns,
                  maxRows: 2,
                },
                emailRequired: true,
                phoneNumberRequired: true,
                shippingAddressRequired: true,
              }}
              onReady={handleReady}
              onClick={handleClick}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              onShippingAddressChange={handleShippingAddressChange}
              onShippingRateChange={handleShippingRateChange}
            />
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            {available && showDivider && (
              <div className="relative mt-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">
                    {t("or")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpressCheckoutWithElements({
  cart,
  basePath,
  onComplete,
  onProcessingChange,
  onAvailabilityChange,
  maxColumns,
  showDivider,
  requiresPolicyConsent,
  policyConsent,
  onPolicyConsentChange,
  showPolicyConsent,
}: ExpressCheckoutResolvedProps) {
  const currency = cart.currency.toLowerCase();

  // Use refs for amount/currency so Elements options stays stable
  // and doesn't cause remount (which destroys the ExpressCheckoutElement).
  // Amount updates are handled via elements.update() inside the inner component.
  // Must use buildLineItems total (not just item_total) because the cart
  // may already include tax/discounts from a prior checkout attempt.
  const initialAmountRef = useRef(() => {
    const items = buildLineItems(cart);
    return items.reduce((sum, item) => sum + item.amount, 0);
  });
  const initialCurrencyRef = useRef(currency);

  const options = useMemo(
    () => ({
      mode: "payment" as const,
      amount: initialAmountRef.current(),
      currency: initialCurrencyRef.current,
      paymentMethodCreation: "manual" as const,
    }),
    [],
  );

  return (
    <Elements stripe={stripePromise} options={options}>
      <ExpressCheckoutInner
        cart={cart}
        basePath={basePath}
        onComplete={onComplete}
        onProcessingChange={onProcessingChange}
        onAvailabilityChange={onAvailabilityChange}
        maxColumns={maxColumns}
        showDivider={showDivider}
        requiresPolicyConsent={requiresPolicyConsent}
        policyConsent={policyConsent}
        onPolicyConsentChange={onPolicyConsentChange}
        showPolicyConsent={showPolicyConsent}
      />
    </Elements>
  );
}

export function ExpressCheckoutButton(props: ExpressCheckoutButtonProps) {
  const { onAvailabilityChange } = props;
  const { user, loading } = useAuth();
  const [internalPolicyConsent, setInternalPolicyConsent] = useState(false);
  const requiresPolicyConsent = props.requiresPolicyConsent ?? !user;
  const isControlled = props.policyConsent !== undefined;
  const policyConsent = props.policyConsent ?? internalPolicyConsent;
  const showPolicyConsent = props.showPolicyConsent ?? !isControlled;

  const handlePolicyConsentChange = useCallback(
    (checked: boolean) => {
      if (!isControlled) setInternalPolicyConsent(checked);
    },
    [isControlled],
  );

  useEffect(() => {
    if (!isStripeConfigured) {
      onAvailabilityChange?.(false);
    }
  }, [onAvailabilityChange]);

  if (!isStripeConfigured) {
    return null;
  }

  if (loading) return null;

  return (
    <ExpressCheckoutWithElements
      {...props}
      requiresPolicyConsent={requiresPolicyConsent}
      policyConsent={policyConsent}
      onPolicyConsentChange={handlePolicyConsentChange}
      showPolicyConsent={showPolicyConsent}
    />
  );
}
