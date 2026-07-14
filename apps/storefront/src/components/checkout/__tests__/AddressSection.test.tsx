import type { Cart, Country } from "@spree/sdk";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddressSection } from "@/components/checkout/AddressSection";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/useCountryStates", () => ({
  useCountryStates: () => [[], false],
}));

vi.mock("@/components/checkout/AddressSelector", () => ({
  AddressSelector: ({
    currentAddress,
  }: {
    currentAddress: { country_iso: string };
  }) => <div data-testid="selected-country">{currentAddress.country_iso}</div>,
}));

const countries = [
  { iso: "CA", name: "Canada" },
  { iso: "US", name: "United States" },
] as unknown as Country[];

const emptyCart = {
  id: "cart-1",
  email: "",
  shipping_address: null,
} as unknown as Cart;

function renderAddressSection({
  cart = emptyCart,
  isAuthenticated = false,
  savedAddresses = [],
}: {
  cart?: Cart;
  isAuthenticated?: boolean;
  savedAddresses?: never[];
} = {}) {
  return render(
    <AddressSection
      cart={cart}
      countries={countries}
      savedAddresses={savedAddresses}
      isAuthenticated={isAuthenticated}
      marketCountryIso="us"
      signInUrl="/us/en/account"
      fetchStates={vi.fn().mockResolvedValue([])}
      onAutoSave={vi.fn().mockResolvedValue(undefined)}
      onEmailBlur={vi.fn().mockResolvedValue(undefined)}
    />,
  );
}

describe("AddressSection market defaults", () => {
  it("defaults a new address to the URL market country rather than country ordering", () => {
    renderAddressSection();

    expect(screen.getByLabelText("country")).toHaveValue("US");
  });

  it("preserves the cart shipping country over the market default", () => {
    renderAddressSection({
      cart: {
        ...emptyCart,
        shipping_address: {
          first_name: null,
          last_name: null,
          address1: null,
          address2: null,
          city: null,
          postal_code: null,
          phone: null,
          company: null,
          country_iso: "CA",
          state_abbr: null,
          state_name: null,
        },
      } as Cart,
    });

    expect(screen.getByLabelText("country")).toHaveValue("CA");
  });

  it("preserves a selected saved address over the market default", () => {
    renderAddressSection({
      isAuthenticated: true,
      savedAddresses: [
        {
          id: "address-ca",
          first_name: "Ada",
          last_name: "Lovelace",
          address1: "1 Queen Street",
          address2: null,
          city: "Toronto",
          postal_code: "M5H 2N2",
          phone: null,
          company: null,
          country_iso: "CA",
          state_abbr: null,
          state_name: null,
        },
      ] as never[],
    });

    expect(screen.getByTestId("selected-country")).toHaveTextContent("CA");
  });
});
