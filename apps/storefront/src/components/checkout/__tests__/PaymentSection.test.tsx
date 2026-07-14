import type { Cart } from "@spree/sdk";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PaymentSection,
  type PaymentSectionHandle,
} from "@/components/checkout/PaymentSection";

let stripeTestMode = false;

const mocks = vi.hoisted(() => ({
  getCreditCards: vi.fn(),
  createCheckoutPaymentSession: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    if (key === "testCardNote") {
      return `Test card: ${values?.testCard ?? ""}`;
    }
    if (key === "savedCardLabel") {
      return `${values?.brand ?? ""} ending in ${values?.digits ?? ""}`;
    }
    return key;
  },
}));

vi.mock("@/lib/utils/stripe", () => ({
  isStripeTestMode: () => stripeTestMode,
}));

vi.mock("@/lib/data/credit-cards", () => ({
  getCreditCards: mocks.getCreditCards,
}));

vi.mock("@/lib/data/payment", () => ({
  createCheckoutPaymentSession: mocks.createCheckoutPaymentSession,
}));

vi.mock("@/components/checkout/StripePaymentForm", () => ({
  StripePaymentForm: () => null,
  confirmWithSavedCard: vi.fn(),
}));

const cart = {
  id: "cart_123",
  total: "10.00",
  amount_due: "10.00",
  currency: "USD",
  shipping_address: null,
  billing_address: null,
  shipping_eq_billing_address: true,
  payment_methods: [
    {
      id: "pm_123",
      name: "Stripe",
      type: "stripe",
      session_required: true,
    },
  ],
} as Cart;

function renderPaymentSection(cartOverride = cart, isAuthenticated = false) {
  const ref = createRef<PaymentSectionHandle>();
  const setProcessing = vi.fn();
  const result = render(
    <PaymentSection
      ref={ref}
      cart={cartOverride}
      countries={[]}
      isAuthenticated={isAuthenticated}
      fetchStates={vi.fn().mockResolvedValue([])}
      onUpdateBillingAddress={vi.fn().mockResolvedValue(true)}
      onPaymentComplete={vi.fn().mockResolvedValue(undefined)}
      processing={false}
      setProcessing={setProcessing}
    />,
  );

  return { ...result, ref, setProcessing };
}

describe("PaymentSection Stripe test guidance", () => {
  beforeEach(() => {
    stripeTestMode = false;
    mocks.getCreditCards.mockResolvedValue({ data: [] });
    mocks.createCheckoutPaymentSession.mockImplementation(
      () => new Promise<never>(() => undefined),
    );
  });

  it("hides test-card guidance for live mode", () => {
    renderPaymentSection();

    expect(screen.queryByText(/4242 4242 4242 4242/)).not.toBeInTheDocument();
  });

  it("shows test-card guidance as an alert in test mode", () => {
    stripeTestMode = true;
    renderPaymentSection();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Test card: 4242 4242 4242 4242",
    );
  });

  it("returns the Stripe configuration error and clears processing when no Stripe method is available", async () => {
    const unavailableCart = {
      ...cart,
      payment_methods: [],
    } as Cart;
    const { ref, setProcessing } = renderPaymentSection(unavailableCart);

    let result: { error?: string } | undefined;
    await act(async () => {
      result = await ref.current?.submit();
    });

    expect(result).toEqual({ error: "stripeUnavailable" });
    expect(setProcessing).toHaveBeenCalledWith(false);
  });

  it("makes the full saved-card row select its radio option", async () => {
    const user = userEvent.setup();
    mocks.getCreditCards.mockResolvedValue({
      data: [
        {
          id: "card-1",
          brand: "visa",
          last4: "4242",
          month: 12,
          year: 2030,
          default: true,
          gateway_payment_profile_id: "pm-card-1",
        },
      ],
    });

    renderPaymentSection(cart, true);

    const radio = await screen.findByRole("radio", {
      name: "Visa ending in 4242",
    });
    const label = document.querySelector('label[for="saved-card-pm-card-1"]');
    expect(label).toHaveClass("absolute", "inset-0", "cursor-pointer");

    await user.click(
      screen.getByRole("radio", { name: "addNewPaymentMethod" }),
    );
    await waitFor(() => expect(radio).not.toBeChecked());
    await user.click(label as HTMLLabelElement);
    expect(radio).toBeChecked();
  });
});
