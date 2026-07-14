import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCart } from "@/contexts/CartContext";
import { updateCartMarket } from "@/lib/data/checkout";
import { setStoreCookies } from "@/lib/utils/cookies";
import { useLocaleSwitch } from "../useLocaleSwitch";

const assign = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/us/en/products/watch",
}));

vi.mock("@/contexts/CartContext", () => ({
  useCart: vi.fn(),
}));

vi.mock("@/lib/data/checkout", () => ({
  updateCartMarket: vi.fn(),
}));

vi.mock("@/lib/utils/cookies", () => ({
  setStoreCookies: vi.fn(),
}));

function mockCart(
  cart: { id: string; currency: string; locale: string } | null,
) {
  const refreshCart = vi.fn().mockResolvedValue(undefined);
  vi.mocked(useCart).mockReturnValue({
    cart,
    refreshCart,
  } as unknown as ReturnType<typeof useCart>);
  return refreshCart;
}

function renderLocaleSwitch(onBeforeNavigate?: () => void) {
  return renderHook(() =>
    useLocaleSwitch({
      currentCountry: "US",
      currentLocale: "en",
      currency: "USD",
      onBeforeNavigate,
    }),
  );
}

describe("useLocaleSwitch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("location", { assign });
  });

  it("navigates directly when there is no cart", async () => {
    mockCart(null);
    const onBeforeNavigate = vi.fn();
    const { result } = renderLocaleSwitch(onBeforeNavigate);

    await act(() => result.current.handleLocaleSelect("ZH"));

    expect(updateCartMarket).not.toHaveBeenCalled();
    expect(setStoreCookies).toHaveBeenCalledWith("us", "zh");
    expect(onBeforeNavigate).toHaveBeenCalledOnce();
    expect(assign).toHaveBeenCalledWith("/us/zh/products/watch");
    expect(onBeforeNavigate.mock.invocationCallOrder[0]).toBeLessThan(
      assign.mock.invocationCallOrder[0],
    );
  });

  it("refreshes the cart after a successful locale update", async () => {
    const refreshCart = mockCart({
      id: "cart-1",
      currency: "USD",
      locale: "en",
    });
    vi.mocked(updateCartMarket).mockResolvedValue({
      success: true,
      cart: {} as never,
    });
    const { result } = renderLocaleSwitch();

    await act(() => result.current.handleLocaleSelect("zh"));

    expect(updateCartMarket).toHaveBeenCalledWith("cart-1", {
      currency: "USD",
      locale: "zh",
    });
    expect(refreshCart).toHaveBeenCalledOnce();
    expect(assign).toHaveBeenCalledWith("/us/zh/products/watch");
  });

  it("still navigates when the cart locale update is rejected", async () => {
    const refreshCart = mockCart({
      id: "cart-1",
      currency: "USD",
      locale: "en",
    });
    vi.mocked(updateCartMarket).mockResolvedValue({
      success: false,
      error: "Locale is not supported",
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { result } = renderLocaleSwitch();

    await act(() => result.current.handleLocaleSelect("zh"));

    expect(refreshCart).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      "useLocaleSwitch: failed to update the cart locale",
      "Locale is not supported",
    );
    expect(setStoreCookies).toHaveBeenCalledWith("us", "zh");
    expect(assign).toHaveBeenCalledWith("/us/zh/products/watch");
  });

  it("still navigates when the cart locale update throws", async () => {
    const refreshCart = mockCart({
      id: "cart-1",
      currency: "USD",
      locale: "en",
    });
    const error = new Error("Network unavailable");
    vi.mocked(updateCartMarket).mockRejectedValue(error);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { result } = renderLocaleSwitch();

    await act(() => result.current.handleLocaleSelect("zh"));

    expect(refreshCart).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      "useLocaleSwitch: failed to update the cart locale",
      error,
    );
    expect(setStoreCookies).toHaveBeenCalledWith("us", "zh");
    expect(assign).toHaveBeenCalledWith("/us/zh/products/watch");
  });

  it("does nothing when selecting the active locale", async () => {
    mockCart(null);
    const { result } = renderLocaleSwitch();

    await act(() => result.current.handleLocaleSelect("EN"));

    expect(setStoreCookies).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });

  it("ignores another selection while navigation is pending", async () => {
    mockCart({ id: "cart-1", currency: "USD", locale: "en" });
    let resolveUpdate:
      | ((value: { success: false; error: string }) => void)
      | null = null;
    vi.mocked(updateCartMarket).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve;
        }),
    );
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { result } = renderLocaleSwitch();

    let firstSelection: Promise<void>;
    act(() => {
      firstSelection = result.current.handleLocaleSelect("zh");
    });
    expect(result.current.isLocaleNavigating).toBe(true);

    await act(() => result.current.handleLocaleSelect("zh"));
    expect(updateCartMarket).toHaveBeenCalledOnce();

    await act(async () => {
      resolveUpdate?.({ success: false, error: "Locale is not supported" });
      await firstSelection;
    });
  });
});
