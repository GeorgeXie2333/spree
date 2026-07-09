"use client";

import type { Cart } from "@spree/sdk";
import { useTranslations } from "next-intl";
import { ProductImage } from "@/components/ui/product-image";

interface SummaryProps {
  cart: Cart;
}

export function Summary({ cart }: SummaryProps) {
  const tc = useTranslations("common");
  const t = useTranslations("checkout");
  const items = cart.items || [];
  const hasShipping = (cart.fulfillments?.length ?? 0) > 0;

  return (
    <div>
      {/* Line items */}
      <div className="space-y-4 pb-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4">
            <div className="relative w-[64px] h-[64px] flex-shrink-0">
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-card">
                <ProductImage
                  src={item.thumbnail_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  iconClassName="w-6 h-6"
                />
              </div>
              {/* Quantity badge */}
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-muted-foreground/90 text-white text-[11px] font-medium rounded-full flex items-center justify-center">
                {item.quantity}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-snug">
                {item.name}
              </p>
              {item.options_text && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.options_text}
                </p>
              )}
            </div>
            <div className="text-sm text-foreground">{item.display_total}</div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{tc("subtotal")}</span>
          <span className="text-foreground">{cart.display_item_total}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{tc("shipping")}</span>
          {hasShipping ? (
            <span className="text-foreground">
              {cart.display_delivery_total}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {t("enterShippingAddress")}
            </span>
          )}
        </div>

        {cart.discount_total && parseFloat(cart.discount_total) !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{tc("discount")}</span>
            <span className="text-foreground">
              {cart.display_discount_total}
            </span>
          </div>
        )}

        {parseFloat(cart.tax_total) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{tc("tax")}</span>
            <span className="text-foreground">{cart.display_tax_total}</span>
          </div>
        )}

        {/* Total row */}
        <div className="flex justify-between items-baseline pt-3 border-t border-border">
          <span className="text-base font-semibold text-foreground">
            {tc("total")}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground uppercase">
              {cart.currency}
            </span>
            <span className="text-xl font-semibold tracking-tight text-foreground">
              {cart.display_total}
            </span>
          </div>
        </div>

        {cart.store_credit_total && parseFloat(cart.store_credit_total) > 0 ? (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{tc("storeCredit")}</span>
            <span className="text-foreground">
              -{cart.display_store_credit_total}
            </span>
          </div>
        ) : null}

        {cart.amount_due &&
          cart.amount_due !== cart.total &&
          parseFloat(cart.amount_due) > 0 && (
            <div className="flex justify-between items-baseline pt-2 border-t border-border">
              <span className="text-base font-semibold text-foreground">
                {tc("amountDue")}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground uppercase">
                  {cart.currency}
                </span>
                <span className="text-xl font-semibold tracking-tight text-foreground">
                  {cart.display_amount_due}
                </span>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
