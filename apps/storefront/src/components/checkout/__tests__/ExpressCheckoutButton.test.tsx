import type { Cart } from "@spree/sdk";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExpressCheckoutButton } from "@/components/checkout/ExpressCheckoutButton";

type ConfirmHandler = (event: Record<string, unknown>) => Promise<void>;
type ReadyHandler = (event: Record<string, unknown>) => void;

const mocks = vi.hoisted(() => ({
  confirmHandler: undefined as ConfirmHandler | undefined,
  readyHandler: undefined as ReadyHandler | undefined,
  authUser: { id: "user-1" } as { id: string } | null,
  authLoading: false,
  routerPush: vi.fn(),
  elements: {
    submit: vi.fn(),
    update: vi.fn(),
  },
  stripe: {
    createPaymentMethod: vi.fn(),
    confirmPayment: vi.fn(),
  },
  preparePayment: vi.fn(),
  createSession: vi.fn(),
  finalize: vi.fn(),
}));

vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => children,
  ExpressCheckoutElement: ({
    onConfirm,
    onReady,
  }: {
    onConfirm: ConfirmHandler;
    onReady: ReadyHandler;
  }) => {
    mocks.confirmHandler = onConfirm;
    mocks.readyHandler = onReady;
    return <div data-testid="express-checkout-element" />;
  },
  useElements: () => mocks.elements,
  useStripe: () => mocks.stripe,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.routerPush }),
  usePathname: () => "/us/en",
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mocks.authUser, loading: mocks.authLoading }),
}));

vi.mock("@/lib/data/express-checkout-flow", () => ({
  expressCheckoutCreateSession: mocks.createSession,
  expressCheckoutFinalize: mocks.finalize,
  expressCheckoutPreparePayment: mocks.preparePayment,
  expressCheckoutResolveShipping: vi.fn(),
  expressCheckoutSelectRates: vi.fn(),
}));

vi.mock("@/lib/utils/express-checkout", () => ({
  buildLineItems: () => [{ name: "CenWatch", amount: 1000 }],
  buildShippingRateMap: vi.fn(),
  buildSpreeAddress: vi.fn(() => ({ country: "US" })),
  parseName: vi.fn(() => ({ first_name: "Ada", last_name: "Lovelace" })),
}));

vi.mock("@/lib/utils/stripe", () => ({
  isStripeConfigured: true,
  stripePromise: Promise.resolve(null),
}));

const cart = {
  id: "cart-1",
  currency: "USD",
  payment_methods: [
    {
      id: "stripe-1",
      name: "Stripe",
      session_required: true,
    },
  ],
} as Cart;

function confirmEvent() {
  return {
    billingDetails: {
      email: "ada@example.com",
      name: "Ada Lovelace",
      phone: "+15551234567",
      address: { country: "US" },
    },
    shippingAddress: {
      name: "Ada Lovelace",
      address: { country: "US" },
    },
    paymentFailed: vi.fn(),
  };
}

function renderButton(onComplete = vi.fn().mockResolvedValue(undefined)) {
  const onProcessingChange = vi.fn();
  render(
    <ExpressCheckoutButton
      basePath="/us/en"
      cart={cart}
      onComplete={onComplete}
      onProcessingChange={onProcessingChange}
    />,
  );

  return { onComplete, onProcessingChange };
}

describe("ExpressCheckoutButton completion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.confirmHandler = undefined;
    mocks.readyHandler = undefined;
    mocks.authUser = { id: "user-1" };
    mocks.authLoading = false;
    mocks.elements.submit.mockResolvedValue({});
    mocks.stripe.createPaymentMethod.mockResolvedValue({
      paymentMethod: { id: "stripe-payment-method-1" },
    });
    mocks.stripe.confirmPayment.mockResolvedValue({ error: undefined });
    mocks.preparePayment.mockResolvedValue({ success: true, cart });
    mocks.createSession.mockResolvedValue({
      success: true,
      session: {
        id: "session-1",
        external_data: { client_secret: "pi_secret_123" },
      },
    });
    mocks.finalize.mockResolvedValue({
      success: true,
      order: { id: "order-1" },
    });
  });

  it("navigates only after finalization returns a completed order", async () => {
    const { onComplete } = renderButton();

    await act(async () => {
      await mocks.confirmHandler?.(confirmEvent());
    });

    expect(mocks.finalize).toHaveBeenCalledWith("cart-1", "session-1");
    expect(mocks.routerPush).toHaveBeenCalledWith("/us/en/order-placed/cart-1");
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("keeps the customer on checkout when finalization cannot prove completion", async () => {
    mocks.finalize.mockResolvedValue({
      success: false,
      error: "Order completion could not be confirmed",
    });
    const { onComplete, onProcessingChange } = renderButton();

    await act(async () => {
      await mocks.confirmHandler?.(confirmEvent());
    });

    expect(
      screen.getByText("Order completion could not be confirmed"),
    ).toBeInTheDocument();
    expect(mocks.routerPush).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(onProcessingChange).toHaveBeenLastCalledWith(false);
  });

  it("keeps the customer on checkout when finalization throws", async () => {
    mocks.finalize.mockRejectedValue(
      new Error("Completion service unavailable"),
    );
    const { onComplete, onProcessingChange } = renderButton();

    await act(async () => {
      await mocks.confirmHandler?.(confirmEvent());
    });

    expect(
      screen.getByText("Completion service unavailable"),
    ).toBeInTheDocument();
    expect(mocks.routerPush).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(onProcessingChange).toHaveBeenLastCalledWith(false);
  });

  it("displays the static policy links for a standalone guest wallet", async () => {
    mocks.authUser = null;

    renderButton();

    await waitFor(() => {
      expect(
        screen.getByTestId("express-checkout-element"),
      ).toBeInTheDocument();
    });
    act(() => {
      mocks.readyHandler?.({
        availablePaymentMethods: { applePay: true },
      });
    });

    expect(screen.getByRole("link", { name: "privacyPolicy" })).toHaveAttribute(
      "href",
      "/us/en/policies/privacy-policy",
    );
    expect(
      screen.getByRole("link", { name: "termsOfService" }),
    ).toHaveAttribute("href", "/us/en/policies/terms-of-service");
  });
});
