"use client";

import type { OptionFilter, ProductFiltersResponse } from "@spree/sdk";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { getAvailabilityLabel } from "@/lib/utils/filters";
import {
  findMatchingBucket,
  type PriceBucket,
} from "@/lib/utils/price-buckets";
import type { ActiveFilters } from "@/types/filters";

interface FilterChipsProps {
  activeFilters: ActiveFilters;
  filtersData: ProductFiltersResponse | null;
  priceBuckets: PriceBucket[];
  onRemoveOptionValue: (optionValueId: string) => void;
  onRemovePrice: () => void;
  onRemoveAvailability: () => void;
  onClearAll: () => void;
}

export function FilterChips({
  activeFilters,
  filtersData,
  priceBuckets,
  onRemoveOptionValue,
  onRemovePrice,
  onRemoveAvailability,
  onClearAll,
}: FilterChipsProps) {
  const t = useTranslations("products");
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (filtersData) {
    for (const optionValueId of activeFilters.optionValues) {
      const optionFilter = filtersData.filters.find(
        (f) =>
          f.type === "option" &&
          (f as OptionFilter).options.some((o) => o.id === optionValueId),
      ) as OptionFilter | undefined;

      if (optionFilter) {
        const option = optionFilter.options.find((o) => o.id === optionValueId);
        if (option) {
          chips.push({
            key: `option-${optionValueId}`,
            label: t("optionFilterChip", {
              filter: optionFilter.label,
              value: option.label,
            }),
            onRemove: () => onRemoveOptionValue(optionValueId),
          });
        }
      }
    }
  }

  if (
    activeFilters.priceMin !== undefined ||
    activeFilters.priceMax !== undefined
  ) {
    const matchingBucket = findMatchingBucket(
      priceBuckets,
      activeFilters.priceMin,
      activeFilters.priceMax,
    );
    chips.push({
      key: "price",
      label: t("priceLabel", {
        value: matchingBucket?.label || t("customPrice"),
      }),
      onRemove: onRemovePrice,
    });
  }

  if (activeFilters.availability) {
    chips.push({
      key: "availability",
      label: getAvailabilityLabel(activeFilters.availability, t),
      onRemove: onRemoveAvailability,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-0.5 rounded-full bg-card py-1 pr-1.5 pl-3 text-xs text-foreground"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            className="rounded-full p-0.5 text-muted-foreground transition-colors duration-200 hover:bg-[#e8e8ed] hover:text-foreground"
            aria-label={t("clearFilter", { label: chip.label })}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="px-1.5 text-sm text-link transition-colors duration-200 hover:underline"
      >
        {t("clearAll")}
      </button>
    </div>
  );
}
