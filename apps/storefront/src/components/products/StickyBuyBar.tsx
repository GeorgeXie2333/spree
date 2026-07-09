"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Price } from "@/components/commerce/Price";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StickyBuyBarProps {
  visible: boolean;
  productName: string;
  /** Formatted current price, e.g. "$129.00". */
  amount?: string | null;
  /** Formatted reference price shown crossed out when on sale. */
  compareAt?: string | null;
  purchasable: boolean;
  loading: boolean;
  onAddToCart: () => void;
}

/**
 * Compact buy bar that slides in when the main Add to Cart button scrolls
 * out of view: fixed to the bottom edge on mobile, pinned below the 84px
 * header on desktop.
 */
export function StickyBuyBar({
  visible,
  productName,
  amount,
  compareAt,
  purchasable,
  loading,
  onAddToCart,
}: StickyBuyBarProps) {
  const t = useTranslations("products");
  const tPdp = useTranslations("pdp");

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-white/80 backdrop-blur-xl transition-transform duration-200 lg:top-[84px] lg:bottom-auto lg:border-t-0 lg:border-b",
        visible
          ? "translate-y-0"
          : "pointer-events-none translate-y-full lg:-translate-y-full",
      )}
    >
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-3">
        {/* Mobile: name + price stacked; desktop: name left, price+CTA right */}
        <div className="min-w-0 flex-1 lg:flex-none">
          <p className="truncate text-sm font-semibold tracking-tight text-foreground">
            {productName}
          </p>
          <div className="lg:hidden">
            <Price
              amount={amount}
              compareAt={compareAt}
              size="sm"
              className="text-muted-foreground [&>span:first-child]:text-foreground"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="hidden lg:block">
            <Price
              amount={amount}
              compareAt={compareAt}
              size="sm"
              className="text-muted-foreground [&>span:first-child]:text-foreground"
            />
          </div>
          <Button
            onClick={onAddToCart}
            disabled={loading || !purchasable}
            tabIndex={visible ? undefined : -1}
            className="shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("adding")}
              </>
            ) : purchasable ? (
              t("addToCart")
            ) : (
              tPdp("outOfStock")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
