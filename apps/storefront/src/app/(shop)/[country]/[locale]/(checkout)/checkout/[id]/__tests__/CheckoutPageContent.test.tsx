import type { Cart } from "@spree/sdk";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { forwardRef, useImperativeHandle } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PaymentSectionHandle } from "@/components/checkout/PaymentSection";
import { CheckoutPageContent } from "../CheckoutPageContent";

const mocks = vi.hoisted(() => ({
  submitPayment: vi.fn(),
  getCheckoutOrder: vi.fn(),
  routerPush: vi.fn(),
  setSummaryContent: vi.fn(),
}));

vi.mock("next/dynamic", () => ({
  default: () => () => null,
}));

vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/us/en/checkout/cart-1",
  useRouter: () => ({ push: mocks.routerPush }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/checkout/AddressSection", () => ({
  AddressSection: () => null,
}));

vi.mock("@/components/checkout/DeliveryMethodSection", () => ({
  DeliveryMethodSection: () => null,
}));

vi.mock("@/components/checkout/PaymentSection", () => ({
  PaymentSection: forwardRef<PaymentSectionHandle>((_props, ref) => {
    useImperativeHandle(ref, () => ({ submit: mocks.submitPayment }));
    return null;
  }),
}));

vi.mock("@/components/policy/PolicyConsent", () => ({
  PolicyConsent: () => null,
}));

vi.mock("@/components/ui/alert", () => ({
  Alert: ({ children }: { children: React.ReactNode }) => (
    <div role="alert">{children}</div>
  ),
  AlertDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock("@/contexts/CartContext", () => ({
  useCart: () => ({ cart: null }),
}));

vi.mock("@/contexts/CheckoutContext", () => ({
  useCheckout: () => ({ setSummaryContent: mocks.setSummaryContent }),
}));

vi.mock("@/lib/analytics/gtm", () => ({
  trackAddPaymentInfo: vi.fn(),
  trackAddShippingInfo: vi.fn(),
  trackBeginCheckout: vi.fn(),
}));

vi.mock("@/lib/data/addresses", () => ({
  getAddresses: vi.fn(),
  updateAddress: vi.fn(),
}));

vi.mock("@/lib/data/checkout", () => ({
  applyCode: vi.fn(),
  getCheckoutOrder: mocks.getCheckoutOrder,
  removeDiscountCode: vi.fn(),
  selectDeliveryRate: vi.fn(),
  updateOrderAddresses: vi.fn(),
}));

vi.mock("@/lib/data/cookies", () => ({
  isAuthenticated: vi.fn(),
}));

vi.mock("@/lib/data/countries", () => ({
  getCountry: vi.fn(),
}));

vi.mock("@/lib/data/markets", () => ({
  getMarketCountries: vi.fn(),
  resolveMarket: vi.fn(),
}));

vi.mock("@/lib/data/payment", () => ({
  completeCheckoutOrder: vi.fn(),
  completeCheckoutPaymentSession: vi.fn(),
}));

vi.mock("@/lib/utils/path", () => ({
  extractBasePath: () => "/us/en",
}));

vi.mock("../CheckoutSidebar", () => ({
  CheckoutSidebar: () => null,
}));

const cart = {
  id: "cart-1",
  items: [{ id: "line-item-1", quantity: 1 }],
  total: "100.00",
  amount_due: "100.00",
  requirements: [],
  payment_methods: [],
} as unknown as Cart;

describe("CheckoutPageContent payment submission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCheckoutOrder.mockResolvedValue(cart);
  });

  it("shows a payment submission error and restores the pay button", async () => {
    mocks.submitPayment.mockResolvedValue({ error: "stripeUnavailable" });
    const user = userEvent.setup();

    render(
      <CheckoutPageContent
        cartId="cart-1"
        initialData={{
          cart,
          countries: [],
          savedAddresses: [],
          isAuthenticated: true,
        }}
        urlCountry="us"
      />,
    );

    const payButton = screen.getByRole("button", { name: "payNow" });
    await user.click(payButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("stripeUnavailable");
      expect(payButton).toBeEnabled();
    });
  });

  it("restores the pay button when payment submission throws", async () => {
    mocks.submitPayment.mockRejectedValue(new Error("Gateway unavailable"));
    const user = userEvent.setup();

    render(
      <CheckoutPageContent
        cartId="cart-1"
        initialData={{
          cart,
          countries: [],
          savedAddresses: [],
          isAuthenticated: true,
        }}
        urlCountry="us"
      />,
    );

    const payButton = screen.getByRole("button", { name: "payNow" });
    await user.click(payButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("paymentError");
      expect(payButton).toBeEnabled();
    });
  });
});
