"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { updateCartMarket } from "@/lib/data/checkout";
import { setStoreCookies } from "@/lib/utils/cookies";
import { getPathWithoutPrefix } from "@/lib/utils/path";

interface UseLocaleSwitchOptions {
  currentCountry: string;
  currentLocale: string;
  currency: string;
  onBeforeNavigate?: () => void;
}

interface UseLocaleSwitchResult {
  isLocaleNavigating: boolean;
  handleLocaleSelect: (locale: string) => Promise<void>;
}

export function useLocaleSwitch({
  currentCountry,
  currentLocale,
  currency,
  onBeforeNavigate,
}: UseLocaleSwitchOptions): UseLocaleSwitchResult {
  const { cart, refreshCart } = useCart();
  const pathname = usePathname();
  const [isLocaleNavigating, setIsLocaleNavigating] = useState(false);

  const handleLocaleSelect = async (locale: string): Promise<void> => {
    const nextLocale = locale.toLowerCase();
    const activeLocale = currentLocale.toLowerCase();
    const country = currentCountry.toLowerCase();
    if (isLocaleNavigating || nextLocale === activeLocale) {
      return;
    }

    setIsLocaleNavigating(true);

    const pathRest = getPathWithoutPrefix(pathname);
    const newPath = `/${country}/${nextLocale}${pathRest}`;

    if (cart && (cart.currency !== currency || cart.locale !== nextLocale)) {
      const result = await updateCartMarket(cart.id, {
        currency,
        locale: nextLocale,
      });

      if (!result.success) {
        setIsLocaleNavigating(false);
        return;
      }

      await refreshCart();
    }

    setStoreCookies(country, nextLocale);
    onBeforeNavigate?.();
    window.location.assign(newPath);
  };

  return {
    isLocaleNavigating,
    handleLocaleSelect,
  };
}
