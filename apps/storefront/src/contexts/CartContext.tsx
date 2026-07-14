"use client";

import type { Cart, LineItem } from "@spree/sdk";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  addToCart as addToCartAction,
  getCart as getCartAction,
  removeCartItem as removeCartItemAction,
  updateCartItem as updateCartItemAction,
} from "@/lib/data/cart";

type CartMutationResult = {
  success: boolean;
  cart?: Cart | null;
  error?: string;
};

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  updating: boolean;
  itemCount: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (
    variantId: string,
    quantity?: number,
  ) => Promise<CartMutationResult>;
  updateItem: (lineItemId: string, quantity: number) => Promise<void>;
  removeItem: (lineItemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("cart");
  const tRef = useRef(t);
  tRef.current = t;

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const refreshCart = useCallback(async () => {
    try {
      const cartData = await getCartAction();
      setCart(cartData);
    } catch {
      toast.error(tRef.current("failedToRefreshCart"));
    } finally {
      setLoading(false);
    }
  }, []);

  const mutateCart = useCallback(
    async (
      action: () => Promise<{
        success: boolean;
        cart?: Cart | null;
        error?: string;
      }>,
      fallbackMessage: string,
      onSuccess?: () => void,
    ): Promise<CartMutationResult> => {
      setUpdating(true);
      try {
        const result = await action();
        if (result.success) {
          setCart(result.cart ?? null);
          onSuccess?.();
          router.refresh();
        } else {
          toast.error(result.error || fallbackMessage);
        }
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : fallbackMessage;
        toast.error(message);
        return { success: false, error: message };
      } finally {
        setUpdating(false);
      }
    },
    [router],
  );

  const addItem = useCallback(
    (variantId: string, quantity = 1) =>
      mutateCart(
        () => addToCartAction(variantId, quantity),
        t("failedToAddItem"),
        () => setIsOpen(true),
      ),
    [mutateCart, t],
  );

  const updateItem = useCallback(
    async (lineItemId: string, quantity: number) => {
      await mutateCart(
        () => updateCartItemAction(lineItemId, quantity),
        t("failedToUpdateItem"),
      );
    },
    [mutateCart, t],
  );

  const removeItem = useCallback(
    async (lineItemId: string) => {
      await mutateCart(
        () => removeCartItemAction(lineItemId),
        t("failedToRemoveItem"),
      );
    },
    [mutateCart, t],
  );

  // Re-fetch cart on navigation (e.g., after checkout completes, a confirmed
  // stale cart clears its token and the cart state updates).
  // On the order-placed page, skip refreshCart to avoid a race condition:
  // getCart() can clear a completed cart token, which removes the only auth
  // token guest users have before getCheckoutOrder() can use it.
  useEffect(() => {
    if (pathname.includes("/order-placed/")) {
      setCart(null);
      setLoading(false);
      return;
    }
    refreshCart();
  }, [refreshCart, pathname]);

  const itemCount = useMemo<number>(
    () =>
      cart?.items?.reduce(
        (sum: number, item: LineItem) => sum + item.quantity,
        0,
      ) ?? 0,
    [cart],
  );

  const value = useMemo<CartContextType>(
    () => ({
      cart,
      loading,
      updating,
      itemCount,
      isOpen,
      openCart,
      closeCart,
      addItem,
      updateItem,
      removeItem,
      refreshCart,
    }),
    [
      cart,
      loading,
      updating,
      itemCount,
      isOpen,
      openCart,
      closeCart,
      addItem,
      updateItem,
      removeItem,
      refreshCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
