"use client";

import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

export function CartButton() {
  const t = useTranslations("header");
  const { itemCount, openCart } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon-lg"
      onClick={openCart}
      aria-label={t("openCart")}
      className="relative"
    >
      <ShoppingBag className="size-5" />
      {mounted && itemCount > 0 && (
        <span className="absolute top-0 right-0 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {itemCount}
        </span>
      )}
    </Button>
  );
}
