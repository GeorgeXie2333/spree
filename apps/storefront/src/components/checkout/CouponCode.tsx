"use client";

import type { Cart } from "@spree/sdk";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CouponCodeProps {
  cart: Cart;
  onApply: (code: string) => Promise<{ success: boolean; error?: string }>;
  onRemoveDiscount: (
    code: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

export function CouponCode({
  cart,
  onApply,
  onRemoveDiscount,
}: CouponCodeProps) {
  const t = useTranslations("coupon");
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const couponPromotions = (cart.discounts || []).filter(
    (promotion): promotion is typeof promotion & { code: string } =>
      Boolean(promotion.code),
  );

  const handleApply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;

    setApplying(true);
    setError(null);

    try {
      const result = await onApply(code.trim());
      if (result.success) {
        setCode("");
      } else {
        setError(result.error || t("invalidCode"));
      }
    } catch {
      setError(t("invalidCode"));
    } finally {
      setApplying(false);
    }
  };

  const handleRemoveDiscount = async (discountCode: string) => {
    setRemoving(discountCode);
    setError(null);

    try {
      const result = await onRemoveDiscount(discountCode);
      if (!result.success) {
        setError(result.error || t("failedToRemove"));
      }
    } catch {
      setError(t("failedToRemove"));
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div>
      {couponPromotions.length > 0 && (
        <div className="mb-3 flex flex-col gap-2">
          {couponPromotions.map((promotion) => (
            <div
              key={promotion.id}
              className="flex items-center justify-between rounded-full border border-border bg-white px-4 py-2"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-foreground">
                  {promotion.code}
                </span>
                <span className="text-muted-foreground">
                  {promotion.display_amount}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveDiscount(promotion.code)}
                disabled={removing === promotion.code}
                aria-label={t("removeCoupon", { code: promotion.code })}
                className="cursor-pointer p-0.5 text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleApply} className="flex gap-2">
        <Input
          type="text"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setError(null);
          }}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          aria-invalid={Boolean(error)}
          className="flex-1 rounded-full bg-white px-4"
        />
        <Button type="submit" disabled={applying || !code.trim()}>
          {applying ? t("applying") : t("apply")}
        </Button>
      </form>

      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
