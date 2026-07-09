"use client";

import type { LineItem } from "@spree/sdk";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { CouponCode } from "@/components/checkout/CouponCode";
import { EmptyState } from "@/components/commerce/EmptyState";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import { useCart } from "@/contexts/CartContext";
import { trackRemoveFromCart, trackViewCart } from "@/lib/analytics/gtm";
import { applyCode, removeDiscountCode } from "@/lib/data/checkout";
import { extractBasePath } from "@/lib/utils/path";

const ExpressCheckoutButton = dynamic(
  () =>
    import("@/components/checkout/ExpressCheckoutButton").then((m) => ({
      default: m.ExpressCheckoutButton,
    })),
  { ssr: false },
);

export default function CartPage() {
  const { cart, loading, updating, updateItem, removeItem, refreshCart } =
    useCart();
  const [expressProcessing, setExpressProcessing] = useState(false);
  const [expressAvailable, setExpressAvailable] = useState(false);
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const viewCartFiredRef = useRef(false);
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const te = useTranslations("expressCheckout");

  // Track view_cart when cart loads with items
  useEffect(() => {
    if (
      !loading &&
      cart &&
      cart.total_quantity > 0 &&
      !viewCartFiredRef.current
    ) {
      trackViewCart(cart);
      viewCartFiredRef.current = true;
    }
  }, [cart, loading]);

  const handleRemove = async (item: LineItem) => {
    await removeItem(item.id);
    if (cart) {
      trackRemoveFromCart(item, cart.currency);
    }
  };

  // Coupon handlers reuse the same server actions as checkout, then refresh
  // the shared cart context so totals update everywhere.
  const cartId = cart?.id;
  const handleApplyCode = useCallback(
    async (code: string) => {
      if (!cartId) return { success: false };
      const result = await applyCode(cartId, code);
      if (result.success) await refreshCart();
      return result;
    },
    [cartId, refreshCart],
  );

  const handleRemoveDiscount = useCallback(
    async (discountCode: string) => {
      if (!cartId) return { success: false };
      const result = await removeDiscountCode(cartId, discountCode);
      if (result.success) await refreshCart();
      return result;
    },
    [cartId, refreshCart],
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-9 bg-card rounded-lg w-40 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-card rounded-[18px]"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          icon={<ShoppingBag />}
          title={t("emptyCart")}
          description={t("emptyCartDescription")}
          action={
            <Button size="lg" asChild>
              <Link href={`${basePath}/products`}>
                {tc("continueShopping")}
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-8">
        {t("shoppingCart")}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-14 items-start">
        {/* Cart Items — quiet rows with hairline separators */}
        <ul className="divide-y divide-border border-t border-b border-border">
          {cart.items.map((item) => (
            <li key={item.id} className="py-6 flex gap-5">
              {/* Image */}
              <Link
                href={`${basePath}/products/${item.slug}`}
                className="relative size-24 bg-card rounded-xl overflow-hidden flex-shrink-0"
              >
                <ProductImage
                  src={item.thumbnail_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </Link>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`${basePath}/products/${item.slug}`}
                  className="text-base font-semibold text-foreground hover:text-link transition-colors duration-200 line-clamp-2"
                >
                  {item.name}
                </Link>
                {item.options_text && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.options_text}
                  </p>
                )}

                {/* Quantity stepper + remove */}
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      type="button"
                      onClick={() =>
                        updateItem(item.id, Math.max(1, item.quantity - 1))
                      }
                      disabled={updating || item.quantity <= 1}
                      aria-label={t("decreaseQuantity")}
                      className="flex size-9 items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors duration-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="min-w-8 text-center text-sm font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateItem(item.id, item.quantity + 1)}
                      disabled={updating}
                      aria-label={t("increaseQuantity")}
                      className="flex size-9 items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors duration-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    disabled={updating}
                    aria-label={t("removeItemLabel", { name: item.name })}
                    className="text-sm text-link hover:underline underline-offset-2 disabled:opacity-50 cursor-pointer"
                  >
                    {tc("remove")}
                  </button>
                </div>
              </div>

              {/* Price — right-aligned */}
              <div className="text-right text-base font-medium text-foreground">
                {item.display_price}
              </div>
            </li>
          ))}
        </ul>

        {/* Order Summary — gray surface card, no border */}
        <div className="bg-card rounded-[18px] p-6 lg:sticky lg:top-[100px]">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {tc("orderSummary")}
          </h2>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{tc("subtotal")}</dt>
              <dd className="text-foreground">{cart.display_item_total}</dd>
            </div>
            {cart.discount_total && parseFloat(cart.discount_total) < 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{tc("discount")}</dt>
                <dd className="text-foreground">
                  {cart.display_discount_total}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{tc("shipping")}</dt>
              <dd className="text-muted-foreground">
                {cart.delivery_total && parseFloat(cart.delivery_total) > 0
                  ? cart.display_delivery_total
                  : t("shippingCalculatedAtCheckout")}
              </dd>
            </div>
            {cart.tax_total && parseFloat(cart.tax_total) > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{tc("tax")}</dt>
                <dd className="text-foreground">{cart.display_tax_total}</dd>
              </div>
            )}
            <div className="border-t border-border pt-4 flex justify-between text-base font-semibold text-foreground">
              <dt>{tc("total")}</dt>
              <dd>{cart.display_total}</dd>
            </div>

            {cart.store_credit_total &&
            parseFloat(cart.store_credit_total) > 0 ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("storeCredit")}</dt>
                <dd className="text-foreground">
                  -{cart.display_store_credit_total}
                </dd>
              </div>
            ) : null}

            {cart.amount_due &&
              cart.amount_due !== cart.total &&
              parseFloat(cart.amount_due) > 0 && (
                <div className="border-t border-border pt-4 flex justify-between text-base font-semibold text-foreground">
                  <dt>{t("amountDue")}</dt>
                  <dd>{cart.display_amount_due}</dd>
                </div>
              )}
          </dl>

          {/* Discount code */}
          <div className="mt-6">
            <CouponCode
              cart={cart}
              onApply={handleApplyCode}
              onRemoveDiscount={handleRemoveDiscount}
            />
          </div>

          <div className="mt-6 space-y-4">
            {!expressProcessing && (
              <Button size="lg" asChild className="w-full">
                <Link href={`${basePath}/checkout/${cart.id}`}>
                  {t("proceedToCheckout")}
                </Link>
              </Button>
            )}

            {/* Express checkout below the main CTA, with an "or" divider */}
            {parseFloat(cart.total) > 0 && (
              <>
                {expressAvailable && !expressProcessing && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-card text-muted-foreground">
                        {te("or")}
                      </span>
                    </div>
                  </div>
                )}
                <ExpressCheckoutButton
                  cart={cart}
                  basePath={basePath}
                  onComplete={() => {}}
                  onProcessingChange={setExpressProcessing}
                  onAvailabilityChange={setExpressAvailable}
                  showDivider={false}
                />
              </>
            )}

            {!expressProcessing && (
              <Button variant="link" asChild className="w-full">
                <Link href={`${basePath}/products`}>
                  {tc("continueShopping")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
