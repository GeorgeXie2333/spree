"use client";

import type {
  AvailabilityFilter,
  OptionFilter,
  ProductFiltersResponse,
} from "@spree/sdk";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  getActiveFilterCount,
  getAvailabilityLabel,
} from "@/lib/utils/filters";
import type { PriceBucket } from "@/lib/utils/price-buckets";
import { findMatchingBucket } from "@/lib/utils/price-buckets";
import {
  type ActiveFilters,
  type AvailabilityStatus,
  isAvailabilityStatus,
} from "@/types/filters";

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filtersData: ProductFiltersResponse | null;
  activeFilters: ActiveFilters;
  priceBuckets: PriceBucket[];
  onApply: (filters: ActiveFilters) => void;
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  filtersData,
  activeFilters,
  priceBuckets,
  onApply,
}: MobileFilterDrawerProps) {
  const t = useTranslations("products");
  const [stagedFilters, setStagedFilters] =
    useState<ActiveFilters>(activeFilters);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only sync when the drawer opens, not when activeFilters changes while open
  useEffect(() => {
    if (isOpen) {
      setStagedFilters(activeFilters);
    }
  }, [isOpen]);

  const handleOptionValueToggle = useCallback((optionValueId: string) => {
    setStagedFilters((prev) => {
      const newOptionValues = prev.optionValues.includes(optionValueId)
        ? prev.optionValues.filter((id) => id !== optionValueId)
        : [...prev.optionValues, optionValueId];
      return { ...prev, optionValues: newOptionValues };
    });
  }, []);

  const handlePriceChange = useCallback((min?: number, max?: number) => {
    setStagedFilters((prev) => ({ ...prev, priceMin: min, priceMax: max }));
  }, []);

  const handleAvailabilityChange = useCallback((value?: AvailabilityStatus) => {
    setStagedFilters((prev) => ({ ...prev, availability: value }));
  }, []);

  const handleClearAll = useCallback(() => {
    setStagedFilters((prev) => ({
      optionValues: [],
      priceMin: undefined,
      priceMax: undefined,
      availability: undefined,
      sortBy: prev.sortBy,
    }));
  }, []);

  const handleApply = useCallback(() => {
    onApply(stagedFilters);
    onClose();
  }, [stagedFilters, onApply, onClose]);

  const stagedCount = getActiveFilterCount(stagedFilters);

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="left"
        className="flex w-full max-w-sm flex-col gap-0 p-0"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <SheetTitle className="sr-only">{t("filters")}</SheetTitle>

        <div className="flex items-center justify-between border-b border-border/60 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label={t("closeFilters")}
          >
            <X className="size-5" />
          </Button>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {t("filters")}
          </h2>
          <div className="w-10" />
        </div>

        <div className="flex-1 divide-y divide-border/60 overflow-y-auto px-5">
          {filtersData?.filters.map((filter) => {
            switch (filter.type) {
              case "option":
                return (
                  <MobileOptionSection
                    key={filter.id}
                    filter={filter as OptionFilter}
                    selectedValues={stagedFilters.optionValues}
                    onToggle={handleOptionValueToggle}
                  />
                );
              case "price_range":
                return (
                  <MobilePriceSection
                    key={filter.id}
                    priceBuckets={priceBuckets}
                    activeFilters={stagedFilters}
                    onPriceChange={handlePriceChange}
                  />
                );
              case "availability":
                return (
                  <MobileAvailabilitySection
                    key={filter.id}
                    filter={filter as AvailabilityFilter}
                    selected={stagedFilters.availability}
                    onChange={handleAvailabilityChange}
                  />
                );
              default:
                return null;
            }
          })}
        </div>

        <div className="space-y-2 border-t border-border/60 p-4">
          {stagedCount > 0 && (
            <Button variant="ghost" className="w-full" onClick={handleClearAll}>
              {t("clearAllFiltersCount", { count: stagedCount })}
            </Button>
          )}
          <Button className="w-full" onClick={handleApply}>
            {t("showResults")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileOptionSection({
  filter,
  selectedValues,
  onToggle,
}: {
  filter: OptionFilter;
  selectedValues: string[];
  onToggle: (id: string) => void;
}) {
  const isColorFilter = filter.kind === "color_swatch";

  return (
    <div className="py-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        {filter.label}
      </h3>
      {isColorFilter ? (
        <div className="space-y-1">
          {filter.options.map((option) => {
            const isSelected = selectedValues.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggle(option.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200",
                  isSelected ? "bg-card" : "hover:bg-card",
                )}
              >
                <span
                  className={cn(
                    "size-7 shrink-0 rounded-full border border-border bg-cover bg-center transition-all duration-200",
                    isSelected &&
                      "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  )}
                  style={
                    option.image_url
                      ? { backgroundImage: `url(${option.image_url})` }
                      : { backgroundColor: option.color_code || "#e8e8ed" }
                  }
                />
                <span
                  className={cn(
                    "flex-1 text-left text-sm",
                    isSelected
                      ? "font-medium text-foreground"
                      : "text-foreground/80",
                  )}
                >
                  {option.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({option.count})
                </span>
                {isSelected && (
                  <Check className="size-4 shrink-0 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {filter.options.map((option) => {
            const isSelected = selectedValues.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggle(option.id)}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-sm transition-colors duration-200",
                  isSelected
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:border-foreground/40",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MobilePriceSection({
  priceBuckets,
  activeFilters,
  onPriceChange,
}: {
  priceBuckets: PriceBucket[];
  activeFilters: ActiveFilters;
  onPriceChange: (min?: number, max?: number) => void;
}) {
  const t = useTranslations("products");

  if (priceBuckets.length === 0) return null;

  const selectedBucket = findMatchingBucket(
    priceBuckets,
    activeFilters.priceMin,
    activeFilters.priceMax,
  );

  return (
    <div className="py-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        {t("price")}
      </h3>
      <div className="space-y-1">
        {priceBuckets.map((bucket) => {
          const isSelected = selectedBucket?.id === bucket.id;
          return (
            <button
              key={bucket.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                if (isSelected) {
                  onPriceChange(undefined, undefined);
                } else {
                  onPriceChange(bucket.min, bucket.max);
                }
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200",
                isSelected
                  ? "bg-card font-medium text-foreground"
                  : "text-foreground/80 hover:bg-card",
              )}
            >
              <span className="flex-1 text-left">{bucket.label}</span>
              {isSelected && <Check className="size-4 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MobileAvailabilitySection({
  filter,
  selected,
  onChange,
}: {
  filter: AvailabilityFilter;
  selected?: AvailabilityStatus;
  onChange: (value?: AvailabilityStatus) => void;
}) {
  const t = useTranslations("products");

  return (
    <div className="py-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        {t("availability")}
      </h3>
      <div className="space-y-1">
        {filter.options.map((option) => {
          const isSelected = selected === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                if (isSelected) {
                  onChange(undefined);
                } else if (isAvailabilityStatus(option.id)) {
                  onChange(option.id);
                }
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200",
                isSelected
                  ? "bg-card font-medium text-foreground"
                  : "text-foreground/80 hover:bg-card",
              )}
            >
              <span className="flex-1 text-left">
                {getAvailabilityLabel(option.id, t)}
              </span>
              <span className="text-xs text-muted-foreground">
                ({option.count})
              </span>
              {isSelected && <Check className="size-4 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
