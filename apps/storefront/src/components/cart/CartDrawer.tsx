"use client";

import { Minus, Plus, ShoppingBag, Trash, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { trackRemoveFromCart, trackViewCart } from "@/lib/analytics/gtm";
import { extractBasePath } from "@/lib/utils/path";

const ExpressCheckoutButton = dynamic(
  () =>
    import("@/components/checkout/ExpressCheckoutButton").then((m) => ({
      default: m.ExpressCheckoutButton,
    })),
  { ssr: false },
);

export function CartDrawer() {
  const {
    cart,
    loading,
    updating,
    isOpen,
    closeCart,
    updateItem,
    removeItem,
    itemCount,
    refreshCart,
  } = useCart();
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const [expressProcessing, setExpressProcessing] = useState(false);
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const viewCartFiredRef = useRef(false);
  const prevPathnameRef = useRef(pathname);

  // Close when navigating
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      closeCart();
      setExpressProcessing(false);
    }
  }, [pathname, closeCart]);

  // Track view_cart when drawer opens with items (fire once per open)
  useEffect(() => {
    if (
      isOpen &&
      cart &&
      cart.total_quantity > 0 &&
      !viewCartFiredRef.current
    ) {
      trackViewCart(cart);
      viewCartFiredRef.current = true;
    }
    if (!isOpen) {
      viewCartFiredRef.current = false;
    }
  }, [isOpen, cart]);

  const lineItems = cart?.items || [];
  const isEmpty = lineItems.length === 0;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeCart();
          setExpressProcessing(false);
        }
      }}
    >
      <SheetContent
        side="right"
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-md flex flex-col p-0 gap-0 bg-background border-border"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <SheetHeader className="flex flex-row gap-2 items-center justify-between border-b border-border px-5 py-4">
          <SheetTitle className="flex flex-row items-baseline gap-2 text-[17px] font-semibold tracking-tight text-foreground">
            <span>{t("cart")}</span>
            {itemCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {t("itemCount", { count: itemCount })}
              </span>
            )}
          </SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeCart}
            aria-label={t("closeCart")}
          >
            <X className="w-5 h-5" />
          </Button>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-5 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="size-20 bg-card rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-card rounded w-3/4" />
                    <div className="h-4 bg-card rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-card mb-4">
                <ShoppingBag
                  className="size-7 text-muted-foreground"
                  strokeWidth={1.25}
                />
              </div>
              <p className="text-base font-semibold tracking-tight text-foreground">
                {t("emptyCart")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("emptyCartDescription")}
              </p>
              <Button asChild className="mt-6" onClick={closeCart}>
                <Link href={`${basePath}/products`}>
                  {tc("continueShopping")}
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border px-5">
              {lineItems.map((item) => (
                <li key={item.id} className="py-5">
                  <div className="flex gap-4">
                    {/* Image */}
                    <Link
                      href={`${basePath}/products/${item.slug}`}
                      className="relative size-20 bg-card rounded-xl overflow-hidden flex-shrink-0"
                      onClick={closeCart}
                    >
                      <ProductImage
                        src={item.thumbnail_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <Link
                          href={`${basePath}/products/${item.slug}`}
                          className="text-sm font-semibold text-foreground hover:text-link transition-colors duration-200 line-clamp-2"
                          onClick={closeCart}
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={async () => {
                            await removeItem(item.id);
                            if (cart) {
                              trackRemoveFromCart(item, cart.currency);
                            }
                          }}
                          disabled={updating}
                          aria-label={t("removeItemLabel", { name: item.name })}
                          className="text-muted-foreground hover:text-destructive transition-colors duration-200 disabled:opacity-50 cursor-pointer p-0.5"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Options */}
                      {item.options_text && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.options_text}
                        </p>
                      )}

                      {/* Quantity & Price */}
                      <div className="mt-3 flex items-center justify-between">
                        {/* Compact pill stepper */}
                        <div className="flex items-center rounded-full border border-border">
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(
                                item.id,
                                Math.max(1, item.quantity - 1),
                              )
                            }
                            disabled={updating || item.quantity <= 1}
                            aria-label={t("decreaseQuantity")}
                            className="flex size-8 items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors duration-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="min-w-6 text-center text-sm font-medium tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(item.id, item.quantity + 1)
                            }
                            disabled={updating}
                            aria-label={t("increaseQuantity")}
                            className="flex size-8 items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors duration-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>

                        <div className="text-sm font-medium">
                          {item.compare_at_amount &&
                          parseFloat(item.compare_at_amount) >
                            parseFloat(item.price) ? (
                            <>
                              <span className="text-muted-foreground line-through mr-2">
                                {item.display_compare_at_amount}
                              </span>
                              <span className="text-destructive">
                                {item.display_price}
                              </span>
                            </>
                          ) : (
                            <span className="text-foreground">
                              {item.display_price}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {!isEmpty && !loading && (
          <SheetFooter className="border-t border-border px-5 py-4 space-y-4">
            {!expressProcessing && (
              <>
                {/* Summary */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">{tc("subtotal")}</span>
                    <span className="font-medium text-foreground">
                      {cart?.display_item_total}
                    </span>
                  </div>
                  {cart?.discount_total &&
                    parseFloat(cart.discount_total) < 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          {tc("discount")}
                        </span>
                        <span className="text-muted-foreground">
                          {cart.display_discount_total}
                        </span>
                      </div>
                    )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {tc("shipping")}
                    </span>
                    <span className="text-muted-foreground">
                      {t("shippingCalculatedAtCheckout")}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Express Checkout — must stay mounted during processing */}
            {cart && parseFloat(cart.total) > 0 && (
              <ExpressCheckoutButton
                cart={cart}
                basePath={basePath}
                onComplete={async () => {
                  await refreshCart();
                  closeCart();
                }}
                onProcessingChange={setExpressProcessing}
              />
            )}

            {!expressProcessing && (
              <div className="space-y-1">
                <Button size="lg" className="w-full" asChild>
                  <Link
                    href={`${basePath}/checkout/${cart?.id}`}
                    onClick={closeCart}
                  >
                    {t("checkout")}
                  </Link>
                </Button>
                <Button size="lg" className="w-full" variant="link" asChild>
                  <Link href={`${basePath}/cart`} onClick={closeCart}>
                    {t("viewCart")}
                  </Link>
                </Button>
              </div>
            )}
          </SheetFooter>
        )}

        {/* Loading overlay */}
        {updating && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-muted-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
