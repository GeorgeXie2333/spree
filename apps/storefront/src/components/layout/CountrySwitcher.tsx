"use client";

import { Check, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/contexts/StoreContext";
import { useCountrySwitch } from "@/hooks/useCountrySwitch";
import { CountryFlagIcon } from "./CountryFlagIcon";

export function CountrySwitcher() {
  const { country, locale, currency, countries, loading } = useStore();
  const tc = useTranslations("common");
  const { isCountryNavigating, handleCountrySelect } = useCountrySwitch({
    currentCountry: country,
    currentLocale: locale,
  });

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground">
        <div className="size-4 animate-spin rounded-full border-2 border-border border-t-transparent" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <CountryFlagIcon countryCode={country} />
          <span className="font-medium">{country.toUpperCase()}</span>
          <span className="text-muted-foreground">|</span>
          <span>{currency}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>{tc("selectCountry")}</DropdownMenuLabel>
        {countries.map((c) => {
          const isSelected = c.iso.toLowerCase() === country.toLowerCase();
          return (
            <DropdownMenuItem
              key={c.iso}
              disabled={isCountryNavigating}
              onSelect={() => handleCountrySelect(c)}
            >
              <CountryFlagIcon countryCode={c.iso} />
              <span className="flex-1 font-medium">{c.name}</span>
              <span className="text-xs text-muted-foreground">
                {c.currency}
              </span>
              {isSelected && <Check className="size-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
