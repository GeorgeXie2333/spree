"use client";

import type { Cart } from "@spree/sdk";
import { CouponCode } from "@/components/checkout/CouponCode";
import { Summary } from "@/components/checkout/Summary";

interface CheckoutSidebarProps {
  cart: Cart;
  onApplyCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  onRemoveDiscount: (
    code: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

export function CheckoutSidebar({
  cart,
  onApplyCode,
  onRemoveDiscount,
}: CheckoutSidebarProps) {
  return (
    <>
      <Summary cart={cart} />
      <div className="mt-6 pt-6 border-t border-border">
        <CouponCode
          cart={cart}
          onApply={onApplyCode}
          onRemoveDiscount={onRemoveDiscount}
        />
      </div>
    </>
  );
}
