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
import { useLocaleSwitch } from "@/hooks/useLocaleSwitch";
import { getLanguageOption, languageOptions } from "@/lib/i18n/languages";

export function LanguageSwitcher() {
  const { country, locale, currency, loading } = useStore();
  const tc = useTranslations("common");
  const currentLanguage = getLanguageOption(locale);
  const { isLocaleNavigating, handleLocaleSelect } = useLocaleSwitch({
    currentCountry: country,
    currentLocale: locale,
    currency,
  });

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label={`${tc("selectLanguage")}: ${currentLanguage.label}`}
        >
          <span className="font-medium">{currentLanguage.shortLabel}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{tc("selectLanguage")}</DropdownMenuLabel>
        {languageOptions.map((option) => {
          const isSelected = option.locale === locale;
          return (
            <DropdownMenuItem
              key={option.locale}
              disabled={isLocaleNavigating}
              onSelect={() => handleLocaleSelect(option.locale)}
            >
              <span className="flex-1 font-medium">{option.label}</span>
              <span className="text-xs uppercase text-muted-foreground">
                {option.locale}
              </span>
              {isSelected && <Check className="w-4 h-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
