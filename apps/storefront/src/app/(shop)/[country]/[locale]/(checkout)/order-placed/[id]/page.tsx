"use client";

import type { Cart } from "@spree/sdk";
import { CircleCheckBig, Package } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { use, useEffect, useRef, useState } from "react";
import { AddressBlock } from "@/components/order/AddressBlock";
import { OrderTotals } from "@/components/order/OrderTotals";
import { PaymentInfo } from "@/components/order/PaymentInfo";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import { Skeleton } from "@/components/ui/skeleton";
import { useCheckout } from "@/contexts/CheckoutContext";
import { trackPurchase } from "@/lib/analytics/gtm";
import { getCompletedOrder } from "@/lib/data/checkout";
import { getCachedCompletedOrder } from "@/lib/utils/completed-order-cache";
import { extractBasePath } from "@/lib/utils/path";

interface OrderPlacedPageProps {
  params: Promise<{
    id: string;
    country: string;
    locale: string;
  }>;
}

export default function OrderPlacedPage({ params }: OrderPlacedPageProps) {
  const { id: cartId } = use(params);
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const { setSummaryContent } = useCheckout();
  const t = useTranslations("orderPlaced");
  const tc = useTranslations("common");

  const [order, setOrder] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"orderNotFound" | "failedToLoad" | null>(
    null,
  );

  // Clear sidebar summary
  useEffect(() => {
    setSummaryContent(null);
  }, [setSummaryContent]);

  // Track whether we've already loaded the order to avoid re-fetching
  // after the cart token cookie is cleared by CartProvider
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    let cancelled = false;

    async function loadOrder() {
      try {
        // Try cached order first (from the completion response),
        // fall back to API for page refreshes.
        const cached = getCachedCompletedOrder(cartId) as Cart | null;
        const orderData = cached ?? (await getCompletedOrder(cartId));
        if (cancelled) return;

        loadedRef.current = true;

        if (orderData) {
          setOrder(orderData);
          try {
            trackPurchase(orderData);
          } catch {
            // Analytics failure must not break the order confirmation UX
          }
        } else {
          setError("orderNotFound");
        }
        setLoading(false);
      } catch {
        if (!cancelled) {
          loadedRef.current = true;
          setError("failedToLoad");
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [cartId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-12">
        <Skeleton className="mx-auto size-12 rounded-full" />
        <Skeleton className="mx-auto h-8 w-1/2 rounded-lg" />
        <Skeleton className="mx-auto h-4 w-1/3 rounded-lg" />
        <Skeleton className="mt-2 h-64 rounded-[18px]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
          {t(error || "orderNotFound")}
        </h1>
        <Button asChild>
          <Link href={`${basePath}/`}>{tc("continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  const customerName =
    order.billing_address?.full_name || order.shipping_address?.full_name || "";

  return (
    <div className="py-8 max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-10">
        <CircleCheckBig
          className="mx-auto mb-4 size-16 text-primary"
          strokeWidth={1.5}
        />
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
          {customerName
            ? t("thanksForOrder", { name: customerName.split(" ")[0] })
            : t("thanksForOrderAnonymous")}
        </h1>
        <p className="text-muted-foreground">
          {t("orderNumber", { number: order.number })}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {t("emailConfirmation")}
        </p>
      </div>

      {/* Order Items */}
      <div className="bg-card rounded-[18px] overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {t("orderItems")}
          </h2>
        </div>
        <ul className="divide-y divide-border">
          {order.items?.map((item) => (
            <li key={item.id} className="px-6 py-4 flex gap-4">
              <div className="relative w-14 h-14 bg-background rounded-xl flex-shrink-0 overflow-hidden">
                <ProductImage
                  src={item.thumbnail_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  iconClassName="w-6 h-6"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground">
                  {item.name}
                </h3>
                {item.options_text && (
                  <p className="text-sm text-muted-foreground">
                    {item.options_text}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {t("qty", { quantity: item.quantity })}
                </p>
              </div>
              <div className="text-sm font-medium text-foreground">
                {item.display_total}
              </div>
            </li>
          ))}
        </ul>

        {/* Totals */}
        <div className="px-6 py-4 border-t border-border">
          <OrderTotals order={order} />
        </div>
      </div>

      {/* Shipping & Payment */}
      <div className="bg-card rounded-[18px] overflow-hidden mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Shipping Method */}
          {order.fulfillments && order.fulfillments.length > 0 && (
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {t("shippingMethod")}
              </h3>
              {order.fulfillments.map((fulfillment) => (
                <div
                  key={fulfillment.id}
                  className="flex items-start gap-3 mb-2 last:mb-0"
                >
                  <Package className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {fulfillment.delivery_method?.name ||
                        t("standardShipping")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fulfillment.display_cost}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Payment Information */}
          {order.payments && order.payments.length > 0 && (
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {t("payment")}
              </h3>
              {order.payments
                .filter((p) => p.status !== "void" && p.status !== "invalid")
                .map((payment) => (
                  <div key={payment.id} className="mb-3 last:mb-0">
                    <PaymentInfo payment={payment} />
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact & Addresses */}
      <div className="bg-card rounded-[18px] overflow-hidden mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {order.shipping_address && (
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                {t("shippingAddress")}
              </h3>
              <AddressBlock address={order.shipping_address} />
            </div>
          )}

          {order.billing_address && (
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                {t("billingAddress")}
              </h3>
              <AddressBlock address={order.billing_address} />
            </div>
          )}
        </div>

        {order.email && (
          <div className="px-6 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {t("confirmationSentTo")}{" "}
              <span className="font-medium text-foreground">{order.email}</span>
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="text-center">
        <Button size="lg" asChild>
          <Link href={`${basePath}/`}>{tc("continueShopping")}</Link>
        </Button>
      </div>
    </div>
  );
}
