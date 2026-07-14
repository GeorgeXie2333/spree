"use client";

import type {
  AvailabilityFilter,
  OptionFilter,
  ProductFiltersResponse,
} from "@spree/sdk";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getAvailabilityLabel } from "@/lib/utils/filters";
import type { PriceBucket } from "@/lib/utils/price-buckets";
import { findMatchingBucket } from "@/lib/utils/price-buckets";
import {
  type ActiveFilters,
  type AvailabilityStatus,
  isAvailabilityStatus,
} from "@/types/filters";

interface FilterSidebarProps {
  filtersData: ProductFiltersResponse;
  activeFilters: ActiveFilters;
  priceBuckets: PriceBucket[];
  onOptionToggle: (optionValueId: string) => void;
  onPriceChange: (min?: number, max?: number) => void;
  onAvailabilityChange: (value?: AvailabilityStatus) => void;
}

/**
 * Apple-style desktop filter sidebar: no boxed cards, filter groups
 * separated by hairline dividers, quiet rows that apply immediately
 * on click (the URL update is handled by the parent via callbacks).
 */
export function FilterSidebar({
  filtersData,
  activeFilters,
  priceBuckets,
  onOptionToggle,
  onPriceChange,
  onAvailabilityChange,
}: FilterSidebarProps) {
  const t = useTranslations("products");

  return (
    <div>
      {filtersData.filters.map((filter) => {
        switch (filter.type) {
          case "option":
            return (
              <SidebarGroup
                key={filter.id}
                title={(filter as OptionFilter).label}
              >
                <OptionGroup
                  filter={filter as OptionFilter}
                  selectedValues={activeFilters.optionValues}
                  onToggle={onOptionToggle}
                />
              </SidebarGroup>
            );
          case "price_range": {
            if (priceBuckets.length === 0) return null;
            const selectedBucket = findMatchingBucket(
              priceBuckets,
              activeFilters.priceMin,
              activeFilters.priceMax,
            );
            return (
              <SidebarGroup key={filter.id} title={t("price")}>
                <div>
                  {priceBuckets.map((bucket) => (
                    <RadioRow
                      key={bucket.id}
                      label={bucket.label}
                      isSelected={selectedBucket?.id === bucket.id}
                      onClick={() => {
                        if (selectedBucket?.id === bucket.id) {
                          onPriceChange(undefined, undefined);
                        } else {
                          onPriceChange(bucket.min, bucket.max);
                        }
                      }}
                    />
                  ))}
                </div>
              </SidebarGroup>
            );
          }
          case "availability":
            return (
              <SidebarGroup key={filter.id} title={t("availability")}>
                <div>
                  {(filter as AvailabilityFilter).options.map((option) => (
                    <RadioRow
                      key={option.id}
                      label={getAvailabilityLabel(option.id, t)}
                      count={option.count}
                      isSelected={activeFilters.availability === option.id}
                      onClick={() => {
                        if (activeFilters.availability === option.id) {
                          onAvailabilityChange(undefined);
                        } else if (isAvailabilityStatus(option.id)) {
                          onAvailabilityChange(option.id);
                        }
                      }}
                    />
                  ))}
                </div>
              </SidebarGroup>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

function SidebarGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border/60 pb-5 pt-5 first:pt-0 last:border-b-0">
      <h3 className="mb-2.5 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function OptionGroup({
  filter,
  selectedValues,
  onToggle,
}: {
  filter: OptionFilter;
  selectedValues: string[];
  onToggle: (id: string) => void;
}) {
  if (filter.kind === "color_swatch") {
    return (
      <div className="flex flex-wrap gap-2.5 pt-1">
        {filter.options.map((option) => {
          const isSelected = selectedValues.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${option.label} (${option.count})`}
              title={`${option.label} (${option.count})`}
              onClick={() => onToggle(option.id)}
              className={cn(
                "size-7 shrink-0 rounded-full border border-border bg-cover bg-center transition-all duration-200",
                isSelected
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "hover:scale-110",
              )}
              style={
                option.image_url
                  ? { backgroundImage: `url(${option.image_url})` }
                  : { backgroundColor: option.color_code || "#e8e8ed" }
              }
            />
          );
        })}
      </div>
    );
  }

  return (
    <div>
      {filter.options.map((option) => {
        const isSelected = selectedValues.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(option.id)}
            className="group flex w-full cursor-pointer items-center gap-2.5 py-1.5 text-left text-sm transition-colors duration-200"
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-4.5 shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-200",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background group-hover:border-foreground/40",
              )}
            >
              {isSelected && <CheckIcon className="size-3" strokeWidth={3} />}
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 truncate transition-colors duration-200",
                isSelected
                  ? "font-medium text-foreground"
                  : "text-foreground/80 group-hover:text-foreground",
              )}
            >
              {option.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function RadioRow({
  label,
  count,
  isSelected,
  onClick,
}: {
  label: string;
  count?: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      className="group flex w-full cursor-pointer items-center gap-2.5 py-1.5 text-left text-sm transition-colors duration-200"
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-4.5 shrink-0 items-center justify-center rounded-full border transition-colors duration-200",
          isSelected
            ? "border-primary"
            : "border-border group-hover:border-foreground/40",
        )}
      >
        {isSelected && <span className="size-2.5 rounded-full bg-primary" />}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate transition-colors duration-200",
          isSelected
            ? "font-medium text-foreground"
            : "text-foreground/80 group-hover:text-foreground",
        )}
      >
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
    </button>
  );
}
