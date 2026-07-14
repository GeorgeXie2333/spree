"use client";

import type {
  AddressParams,
  Cart,
  Country,
  PaymentMethod,
  CreditCard as SpreeCreditCard,
  State,
} from "@spree/sdk";
import { CircleAlert, CreditCard, Info, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { PaymentIcon } from "react-svg-credit-card-payment-icons";
import { AddressFormFields } from "@/components/checkout/AddressFormFields";
import {
  confirmWithSavedCard,
  StripePaymentForm,
  type StripePaymentFormHandle,
} from "@/components/checkout/StripePaymentForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCountryStates } from "@/hooks/useCountryStates";
import { getCreditCards } from "@/lib/data/credit-cards";
import { createCheckoutPaymentSession } from "@/lib/data/payment";
import { cn } from "@/lib/utils";
import {
  type AddressFormData,
  addressToFormData,
  formDataToAddress,
  updateAddressField,
} from "@/lib/utils/address";
import { getCardIconType, getCardLabel } from "@/lib/utils/credit-card";
import { extractBasePath } from "@/lib/utils/path";
import { isStripePaymentMethod } from "@/lib/utils/payment-gateway";
import { isStripeTestMode } from "@/lib/utils/stripe";

export type PaymentCompleteResult =
  | { type: "session"; sessionId: string; sessionResult?: string }
  | { type: "direct" };

export interface PaymentSectionHandle {
  submit: () => Promise<{ error?: string }>;
}

interface PaymentSectionProps {
  ref?: Ref<PaymentSectionHandle>;
  cart: Cart;
  countries: Country[];
  isAuthenticated: boolean;
  fetchStates: (countryIso: string) => Promise<State[]>;
  onUpdateBillingAddress: (data: {
    billing_address?: AddressParams;
    use_shipping?: boolean;
  }) => Promise<boolean>;
  onPaymentComplete: (result: PaymentCompleteResult) => Promise<void>;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
  onSessionMethodChange?: (isSessionBased: boolean) => void;
  errors?: string[];
}

export function PaymentSection({
  ref,
  cart,
  countries,
  isAuthenticated,
  fetchStates,
  onUpdateBillingAddress,
  onPaymentComplete,
  processing,
  setProcessing,
  onSessionMethodChange,
  errors,
}: PaymentSectionProps) {
  const t = useTranslations("checkout");

  // ── Payment methods from Spree ──────────────────────────────────────
  const paymentMethods = (cart.payment_methods ?? []).filter(
    isStripePaymentMethod,
  );
  const hasMultipleMethods = paymentMethods.length > 1;

  // Default to the first method; fall back if the stored ID becomes stale
  // (e.g. cart.payment_methods changes after a shipping update).
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    () => paymentMethods[0]?.id ?? "",
  );
  const selectedMethod: PaymentMethod | undefined =
    paymentMethods.find((pm) => pm.id === selectedMethodId) ??
    paymentMethods[0];
  const effectiveSelectedMethodId = selectedMethod?.id ?? "";
  // Zero-amount check
  const amountDue = parseFloat(cart.amount_due ?? cart.total);
  const isZeroAmount = amountDue === 0;

  // Free orders are always treated as non-session (no payment needed)
  const isSessionBased =
    !isZeroAmount && (selectedMethod?.session_required ?? false);

  // Notify parent when session method changes (for button text)
  const onSessionMethodChangeRef = useRef(onSessionMethodChange);
  onSessionMethodChangeRef.current = onSessionMethodChange;

  const prevIsSessionRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevIsSessionRef.current === isSessionBased) return;
    prevIsSessionRef.current = isSessionBased;
    onSessionMethodChangeRef.current?.(isSessionBased);
  }, [isSessionBased]);

  // ── Billing address ─────────────────────────────────────────────────
  const shipAddressData = useMemo(
    () => addressToFormData(cart.shipping_address),
    [cart.shipping_address],
  );
  const billAddressData = useMemo(
    () => addressToFormData(cart.billing_address),
    [cart.billing_address],
  );
  const initialUseShipping =
    !cart.billing_address || cart.shipping_eq_billing_address;

  const [billAddress, setBillAddress] = useState<AddressFormData>(
    initialUseShipping ? shipAddressData : billAddressData,
  );
  const [useShippingForBilling, setUseShippingForBilling] =
    useState(initialUseShipping);

  // ── Saved cards (session-based gateways only) ───────────────────────
  const [savedCards, setSavedCards] = useState<SpreeCreditCard[]>([]);
  // null = "add new payment method", string = gateway_payment_profile_id
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // ── Payment gateway state (session-based) ───────────────────────────
  // Stores the raw external_data from the Spree PaymentSession.
  // Stripe returns the client secret used by the Payment Element.
  const [sessionExternalData, setSessionExternalData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const gatewayHandleRef = useRef<StripePaymentFormHandle | null>(null);
  const initRef = useRef(false);
  const sessionRequestIdRef = useRef(0);
  const completionInFlightRef = useRef(false);

  const handleGatewayReady = useCallback((handle: StripePaymentFormHandle) => {
    gatewayHandleRef.current = handle;
  }, []);

  // ── Session management ──────────────────────────────────────────────
  const createSession = useCallback(
    async (cardId: string | null, method: PaymentMethod) => {
      const requestId = ++sessionRequestIdRef.current;

      setLoading(true);
      setGatewayError(null);
      setSessionExternalData(null);
      setPaymentSessionId(null);
      gatewayHandleRef.current = null;

      try {
        // Build gateway-specific external_data
        const basePath = extractBasePath(window.location.pathname);
        const returnUrl = `${window.location.origin}${basePath}/confirm-payment/${cart.id}`;

        const externalData: Record<string, unknown> = {
          return_url: returnUrl,
        };

        if (cardId) {
          externalData.stripe_payment_method_id = cardId;
        }

        const result = await createCheckoutPaymentSession(
          cart.id,
          method.id,
          externalData,
        );

        if (requestId !== sessionRequestIdRef.current) return;

        if (result.success && result.session) {
          const extData = result.session.external_data;
          if (extData && Object.keys(extData).length > 0) {
            setSessionExternalData(extData);
            setPaymentSessionId(result.session.id);
          } else {
            setGatewayError(t("failedToInitPayment"));
          }
        } else if (!result.success) {
          setGatewayError(result.error || t("failedToCreateSession"));
        }
      } catch {
        if (requestId !== sessionRequestIdRef.current) return;
        setGatewayError(t("failedToInitPayment"));
      } finally {
        if (requestId === sessionRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [cart.id, t],
  );

  // Track the cart total so we can recreate the session when it changes
  const lastTotalRef = useRef<string | null>(null);
  const selectedCardRef = useRef<string | null>(null);

  // On mount: load saved cards (if authenticated + session method), then create initial session
  useEffect(() => {
    if (initRef.current) return;
    if (!selectedMethod) return;
    if (isZeroAmount) return;
    if (!isSessionBased) return;

    initRef.current = true;

    const init = async () => {
      setLoading(true);

      let initialCardId: string | null = null;

      if (isAuthenticated) {
        try {
          const result = await getCreditCards();
          const gatewayCards = result.data.filter(
            (card) => card.gateway_payment_profile_id,
          );
          setSavedCards(gatewayCards);

          if (gatewayCards.length > 0) {
            const defaultCard =
              gatewayCards.find((c) => c.default) || gatewayCards[0];
            initialCardId = defaultCard.gateway_payment_profile_id;
            setSelectedCardId(initialCardId);
          }
        } catch {
          // Cards failed to load — proceed without saved cards
        }
      }

      selectedCardRef.current = initialCardId;
      lastTotalRef.current = cart.total;

      await createSession(initialCardId, selectedMethod);
    };

    init();
  }, [
    selectedMethod,
    isSessionBased,
    isAuthenticated,
    createSession,
    cart.total,
    isZeroAmount,
  ]);

  // When cart total changes, recreate the payment session
  useEffect(() => {
    if (!initRef.current) return;
    if (!isSessionBased || !selectedMethod) return;
    if (lastTotalRef.current === cart.total) return;

    lastTotalRef.current = cart.total;
    createSession(selectedCardRef.current, selectedMethod);
  }, [cart.total, createSession, isSessionBased, selectedMethod]);

  const [billStates, isPendingBill] = useCountryStates(
    billAddress.country_iso,
    fetchStates,
    !useShippingForBilling,
  );

  const handleUseShippingChange = (checked: boolean) => {
    setUseShippingForBilling(checked);
    if (checked) {
      setBillAddress(shipAddressData);
    }
  };

  const handleCardSelect = (cardId: string | null) => {
    if (cardId === selectedCardId) return;
    if (!selectedMethod) return;
    setSelectedCardId(cardId);
    selectedCardRef.current = cardId;
    createSession(cardId, selectedMethod);
  };

  const handleMethodSelect = (methodId: string) => {
    if (methodId === selectedMethodId) return;
    setSelectedMethodId(methodId);

    const newMethod = paymentMethods.find((pm) => pm.id === methodId);
    if (!newMethod) return;

    if (newMethod.session_required) {
      // Switching to a session-based method: create session
      // Reset saved cards state — will be re-initialized
      if (!initRef.current) {
        initRef.current = true;
        const init = async () => {
          setLoading(true);
          let cardId: string | null = null;

          if (isAuthenticated) {
            try {
              const result = await getCreditCards();
              const gatewayCards = result.data.filter(
                (card) => card.gateway_payment_profile_id,
              );
              setSavedCards(gatewayCards);
              if (gatewayCards.length > 0) {
                const defaultCard =
                  gatewayCards.find((c) => c.default) || gatewayCards[0];
                cardId = defaultCard.gateway_payment_profile_id;
                setSelectedCardId(cardId);
              }
            } catch {
              // proceed without saved cards
            }
          }

          selectedCardRef.current = cardId;
          lastTotalRef.current = cart.total;
          await createSession(cardId, newMethod);
        };
        init();
      } else {
        createSession(selectedCardRef.current, newMethod);
      }
    } else {
      // Switching to a direct method: invalidate any in-flight session
      // request so a late-resolving createSession won't repopulate state.
      sessionRequestIdRef.current += 1;
      setSessionExternalData(null);
      setPaymentSessionId(null);
      setGatewayError(null);
      gatewayHandleRef.current = null;
      setLoading(false);
    }
  };

  const updateBillAddress = (field: keyof AddressFormData, value: string) => {
    setBillAddress((prev) => updateAddressField(prev, field, value));
  };

  // ── Submit ──────────────────────────────────────────────────────────
  useImperativeHandle(
    ref,
    () => ({
      submit: async () => {
        if (completionInFlightRef.current) return {};
        completionInFlightRef.current = true;

        try {
          // Zero amount — no payment needed
          if (isZeroAmount) {
            setProcessing(true);
            try {
              // Still update billing address
              let addressSuccess: boolean;
              if (useShippingForBilling) {
                addressSuccess = await onUpdateBillingAddress({
                  use_shipping: true,
                });
              } else {
                const billingData = formDataToAddress(billAddress);
                addressSuccess = await onUpdateBillingAddress({
                  billing_address: billingData,
                });
              }
              if (!addressSuccess) {
                setProcessing(false);
                return { error: t("failedToSaveBilling") };
              }
              await onPaymentComplete({ type: "direct" });
              return {};
            } catch {
              const msg = t("paymentError");
              setProcessing(false);
              return { error: msg };
            }
          }

          if (!selectedMethod) {
            setProcessing(false);
            return {
              error:
                paymentMethods.length === 0
                  ? t("stripeUnavailable")
                  : t("selectPaymentMethod"),
            };
          }

          setProcessing(true);
          setGatewayError(null);

          try {
            // 1. Update billing address
            let addressSuccess: boolean;
            if (useShippingForBilling) {
              addressSuccess = await onUpdateBillingAddress({
                use_shipping: true,
              });
            } else {
              const billingData = formDataToAddress(billAddress);
              addressSuccess = await onUpdateBillingAddress({
                billing_address: billingData,
              });
            }

            if (!addressSuccess) {
              setProcessing(false);
              return { error: t("failedToSaveBilling") };
            }

            // 2. Process payment based on method type
            if (selectedMethod.session_required) {
              // Stripe payment-session flow.
              if (!paymentSessionId || !sessionExternalData) {
                setProcessing(false);
                return { error: t("failedToInitPayment") };
              }
              const basePath = extractBasePath(window.location.pathname);
              const returnUrl = `${window.location.origin}${basePath}/confirm-payment/${cart.id}?session=${paymentSessionId}`;

              let error: string | undefined;

              const clientSecret = sessionExternalData.client_secret as
                | string
                | undefined;
              const canUseSavedCard = Boolean(selectedCardId && clientSecret);

              if (!canUseSavedCard && !gatewayHandleRef.current) {
                setProcessing(false);
                return { error: t("failedToInitPayment") };
              }

              if (canUseSavedCard) {
                // Stripe saved card flow
                const result = await confirmWithSavedCard(
                  clientSecret!,
                  selectedCardId!,
                  returnUrl,
                  {
                    stripeNotLoaded: t("stripeNotLoaded"),
                    paymentProcessingError: t("paymentProcessingError"),
                  },
                );
                error = result.error;
              } else {
                // New card via Stripe Payment Element.
                const result =
                  await gatewayHandleRef.current!.confirmPayment(returnUrl);
                error = result.error;
              }

              if (error) {
                setGatewayError(error);
                setProcessing(false);
                return { error };
              }

              await onPaymentComplete({
                type: "session",
                sessionId: paymentSessionId,
              });
              return {};
            }

            // Direct payment flow (Check, Cash on Delivery, etc.)
            setProcessing(false);
            return { error: t("stripeUnavailable") };
          } catch {
            const msg = t("paymentError");
            setGatewayError(msg);
            setProcessing(false);
            return { error: msg };
          }
        } finally {
          completionInFlightRef.current = false;
        }
      },
    }),
    [
      isZeroAmount,
      selectedMethod,
      paymentMethods.length,
      paymentSessionId,
      sessionExternalData,
      selectedCardId,
      useShippingForBilling,
      billAddress,
      onUpdateBillingAddress,
      onPaymentComplete,
      cart.id,
      setProcessing,
      t,
    ],
  );

  const isAddingNew = selectedCardId === null;

  // ── Zero amount: no payment required ────────────────────────────────
  if (isZeroAmount) {
    return (
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {t("paymentMethod")}
        </h2>
        <div className="mt-3 rounded-xl border border-border bg-card px-4 py-6 text-center">
          <Info
            className="mx-auto mb-2 size-8 text-muted-foreground"
            strokeWidth={1.5}
          />
          <p className="text-sm text-muted-foreground">
            {t("noPaymentRequired")}
          </p>
        </div>

        {/* Billing address */}
        <div className="mt-4">
          <Field orientation="horizontal" className="items-center">
            <Checkbox
              id="zero-use-shipping-for-billing"
              checked={useShippingForBilling}
              onCheckedChange={(checked) =>
                handleUseShippingChange(checked === true)
              }
            />
            <FieldLabel
              htmlFor="zero-use-shipping-for-billing"
              className="cursor-pointer"
            >
              {t("sameAsShipping")}
            </FieldLabel>
          </Field>
          {!useShippingForBilling && (
            <div className="mt-4">
              <AddressFormFields
                address={billAddress}
                countries={countries}
                states={billStates}
                loadingStates={isPendingBill}
                onChange={updateBillAddress}
                idPrefix="bill"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── No payment methods available ────────────────────────────────────
  if (paymentMethods.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {t("paymentMethod")}
        </h2>
        <div className="mt-3 rounded-xl border border-border bg-card px-4 py-8 text-center">
          <CreditCard
            className="mx-auto mb-3 size-10 text-muted-foreground"
            strokeWidth={1.5}
          />
          <p className="text-sm text-muted-foreground">
            {t("stripeUnavailable")}
          </p>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div>
      {/* Section Header */}
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {t("paymentMethod")}
      </h2>
      <p className="text-sm text-muted-foreground mt-0.5">
        {t("secureTransactions")}
      </p>

      {/* Inline requirement errors from parent */}
      {errors && errors.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 mb-3 mt-2">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-destructive">
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Payment methods — Apple-style outlined selection blocks */}
      <RadioGroup
        value={effectiveSelectedMethodId}
        onValueChange={handleMethodSelect}
        className="gap-3 mt-3"
        aria-label={t("paymentMethod")}
      >
        {paymentMethods.map((pm) => {
          const isSelected = pm.id === effectiveSelectedMethodId;

          return (
            <Field
              key={pm.id}
              className={cn(
                isSelected
                  ? "rounded-xl border-2 border-primary bg-primary/[0.04] overflow-hidden"
                  : "rounded-xl border border-border bg-background overflow-hidden",
              )}
            >
              {/* Method header row */}
              {hasMultipleMethods && (
                <FieldLabel
                  htmlFor={`payment-method-${pm.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
                >
                  <RadioGroupItem
                    id={`payment-method-${pm.id}`}
                    value={pm.id}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {pm.name}
                  </span>
                </FieldLabel>
              )}

              {/* Single method header (no radio, like current behavior) */}
              {!hasMultipleMethods && (
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem
                      id={`payment-method-${pm.id}`}
                      value={pm.id}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {pm.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Sub-form for the selected method */}
              {isSelected && (
                <div className="border-t border-border">
                  {/* Stripe: saved cards selector */}
                  {/* Demo-only test card note */}
                  {isStripeTestMode() && (
                    <Alert className="mx-4 mt-3">
                      <Info />
                      <AlertDescription>
                        {t("testCardNote", {
                          testCard: "4242 4242 4242 4242",
                        })}
                      </AlertDescription>
                    </Alert>
                  )}

                  {savedCards.length > 0 && (
                    <div className="px-4 pt-3">
                      <RadioGroup
                        value={selectedCardId ?? "__new__"}
                        onValueChange={(val) =>
                          handleCardSelect(val === "__new__" ? null : val)
                        }
                        className="gap-2"
                        aria-label={t("paymentMethod")}
                      >
                        {savedCards.map((card) => {
                          const cardId =
                            card.gateway_payment_profile_id ?? card.id;
                          return (
                            <Field
                              key={card.id}
                              orientation="horizontal"
                              className={cn(
                                "relative cursor-pointer items-center rounded-xl border px-4 py-3",
                                selectedCardId ===
                                  card.gateway_payment_profile_id
                                  ? "border-2 border-primary bg-primary/[0.04]"
                                  : "border-border bg-background hover:bg-card",
                              )}
                            >
                              <RadioGroupItem
                                id={`saved-card-${cardId}`}
                                value={cardId}
                                className="relative z-10"
                              />
                              <PaymentIcon
                                type={getCardIconType(card.brand)}
                                format="flatRounded"
                                width={34}
                              />
                              <FieldLabel
                                htmlFor={`saved-card-${cardId}`}
                                className="absolute inset-0 cursor-pointer"
                              >
                                <span className="sr-only">
                                  {t("savedCardLabel", {
                                    brand: getCardLabel(card.brand),
                                    digits: card.last4,
                                  })}
                                </span>
                              </FieldLabel>
                              <span className="flex-1 text-sm text-foreground">
                                {t("savedCardLabel", {
                                  brand: getCardLabel(card.brand),
                                  digits: card.last4,
                                })}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {t("cardExpiry", {
                                  month: String(card.month).padStart(2, "0"),
                                  year: String(card.year),
                                })}
                              </span>
                              {card.default && (
                                <span className="text-[11px] font-medium text-muted-foreground bg-card px-1.5 py-0.5 rounded">
                                  {t("default")}
                                </span>
                              )}
                            </Field>
                          );
                        })}

                        {/* Add new card */}
                        <Field
                          orientation="horizontal"
                          className={cn(
                            "relative cursor-pointer items-center rounded-xl border px-4 py-3",
                            isAddingNew
                              ? "border-2 border-primary bg-primary/[0.04]"
                              : "border-border bg-background hover:bg-card",
                          )}
                        >
                          <RadioGroupItem
                            id="saved-card-new"
                            value="__new__"
                            className="relative z-10"
                          />
                          <FieldLabel
                            htmlFor="saved-card-new"
                            className="absolute inset-0 cursor-pointer"
                          >
                            <span className="sr-only">
                              {t("addNewPaymentMethod")}
                            </span>
                          </FieldLabel>
                          <CreditCard
                            className="size-5 text-muted-foreground"
                            strokeWidth={1.5}
                          />
                          <span className="text-sm text-foreground">
                            {t("addNewPaymentMethod")}
                          </span>
                        </Field>
                      </RadioGroup>
                    </div>
                  )}

                  {/* Shared: loading spinner */}
                  {loading && (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="size-5 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        {t("loadingPaymentForm")}
                      </span>
                    </div>
                  )}

                  {/* Shared: gateway error */}
                  {gatewayError && !loading && (
                    <div className="px-4 py-3">
                      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                        <p className="text-sm text-destructive flex items-center gap-2">
                          <CircleAlert className="size-4 shrink-0" />
                          {gatewayError}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Stripe payment form */}
                  {!loading &&
                    sessionExternalData &&
                    (() => {
                      const secret = sessionExternalData.client_secret as
                        | string
                        | undefined;
                      return (
                        secret &&
                        isAddingNew && (
                          <div className="p-4">
                            <StripePaymentForm
                              key={secret}
                              clientSecret={secret}
                              onReady={handleGatewayReady}
                            />
                          </div>
                        )
                      );
                    })()}
                </div>
              )}
            </Field>
          );
        })}
      </RadioGroup>

      {/* Billing address — below payment box */}
      <div className="mt-4">
        <Field orientation="horizontal" className="items-center">
          <Checkbox
            id="use-shipping-for-billing"
            checked={useShippingForBilling}
            onCheckedChange={(checked) =>
              handleUseShippingChange(checked === true)
            }
          />
          <FieldLabel
            htmlFor="use-shipping-for-billing"
            className="cursor-pointer"
          >
            {t("sameAsShipping")}
          </FieldLabel>
        </Field>

        {!useShippingForBilling && (
          <div className="mt-4">
            <AddressFormFields
              address={billAddress}
              countries={countries}
              states={billStates}
              loadingStates={isPendingBill}
              onChange={updateBillAddress}
              idPrefix="bill"
            />
          </div>
        )}
      </div>
    </div>
  );
}
