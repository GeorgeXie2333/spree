import type { Cart } from "@spree/sdk";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentSection } from "@/components/checkout/PaymentSection";

let stripeTestMode = false;

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    key === "testCardNote" ? `Test card: ${values?.testCard ?? ""}` : key,
}));

vi.mock("@/lib/utils/stripe", () => ({
  isStripeTestMode: () => stripeTestMode,
}));

vi.mock("@/lib/data/credit-cards", () => ({
  getCreditCards: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock("@/lib/data/payment", () => ({
  createCheckoutPaymentSession: vi.fn(
    () => new Promise<never>(() => undefined),
  ),
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

function renderPaymentSection() {
  return render(
    <PaymentSection
      cart={cart}
      countries={[]}
      isAuthenticated={false}
      fetchStates={vi.fn().mockResolvedValue([])}
      onUpdateBillingAddress={vi.fn().mockResolvedValue(true)}
      onPaymentComplete={vi.fn().mockResolvedValue(undefined)}
      processing={false}
      setProcessing={vi.fn()}
    />,
  );
}

describe("PaymentSection Stripe test guidance", () => {
  beforeEach(() => {
    stripeTestMode = false;
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
});
