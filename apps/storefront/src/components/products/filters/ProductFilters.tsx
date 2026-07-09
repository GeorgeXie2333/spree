"use client";

import type {
  OptionFilter,
  PriceRangeFilter,
  ProductFiltersResponse,
} from "@spree/sdk";
import { SlidersHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { JSX } from "react";
import { useCallback, useMemo, useState } from "react";
import { FilterBarSkeleton } from "@/components/products/filters/FilterBarSkeleton";
import { FilterChips } from "@/components/products/filters/FilterChips";
import { FilterDropdown } from "@/components/products/filters/FilterDropdown";
import { FilterSidebar } from "@/components/products/filters/FilterSidebar";
import { MobileFilterDrawer } from "@/components/products/filters/MobileFilterDrawer";
import { SortDropdownContent } from "@/components/products/filters/SortDropdownContent";
import { Button } from "@/components/ui/button";
import { getActiveFilterCount, getSortLabel } from "@/lib/utils/filters";
import { generatePriceBuckets } from "@/lib/utils/price-buckets";
import type { ActiveFilters, AvailabilityStatus } from "@/types/filters";

interface FilterBarProps {
  filtersData: ProductFiltersResponse | null;
  filtersLoading: boolean;
  activeFilters: ActiveFilters;
  totalCount: number;
  onFilterChange: (filters: ActiveFilters) => void;
  /** The product grid (or empty state) rendered in the main column. */
  children?: React.ReactNode;
}

/**
 * PLP layout + filter chrome. Desktop renders a left sticky sidebar
 * with always-visible filter groups next to the product grid; mobile
 * renders a full-width grid with a pill "Filters" button opening the
 * drawer. A toolbar row above the grid holds the results count and
 * the sort dropdown, with active-filter chips below it.
 */
export function FilterBar({
  filtersData,
  filtersLoading,
  activeFilters,
  totalCount,
  onFilterChange,
  children,
}: FilterBarProps): JSX.Element | null {
  const t = useTranslations("products");
  const locale = useLocale();
  const [sortOpen, setSortOpen] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const handleOptionValueToggle = useCallback(
    (optionValueId: string) => {
      const newOptionValues = activeFilters.optionValues.includes(optionValueId)
        ? activeFilters.optionValues.filter((id) => id !== optionValueId)
        : [...activeFilters.optionValues, optionValueId];
      onFilterChange({ ...activeFilters, optionValues: newOptionValues });
    },
    [activeFilters, onFilterChange],
  );

  const handlePriceChange = useCallback(
    (min?: number, max?: number) => {
      onFilterChange({ ...activeFilters, priceMin: min, priceMax: max });
    },
    [activeFilters, onFilterChange],
  );

  const handleAvailabilityChange = useCallback(
    (availability?: AvailabilityStatus) => {
      onFilterChange({ ...activeFilters, availability });
    },
    [activeFilters, onFilterChange],
  );

  const handleSortChange = useCallback(
    (sortBy: string) => {
      onFilterChange({ ...activeFilters, sortBy });
      setSortOpen(false);
    },
    [activeFilters, onFilterChange],
  );

  const clearFilters = useCallback(() => {
    onFilterChange({
      optionValues: [],
      priceMin: undefined,
      priceMax: undefined,
      availability: undefined,
      sortBy: activeFilters.sortBy,
    });
  }, [onFilterChange, activeFilters.sortBy]);

  const priceBuckets = useMemo(() => {
    if (!filtersData) return [];
    const priceFilter = filtersData.filters.find(
      (f) => f.type === "price_range",
    ) as PriceRangeFilter | undefined;
    if (!priceFilter) return [];
    return generatePriceBuckets(
      priceFilter.min,
      priceFilter.max,
      priceFilter.currency,
      { t, locale },
    );
  }, [filtersData, t, locale]);

  const totalActiveFilters = getActiveFilterCount(activeFilters);
  const hasActiveFilters = totalActiveFilters > 0;
  const activeSortBy = activeFilters.sortBy || filtersData?.default_sort;

  if (!filtersData && filtersLoading) {
    return (
      <div>
        <FilterBarSkeleton />
        <div className="pt-6">{children}</div>
      </div>
    );
  }

  const hasFilterGroups =
    filtersData?.filters.some(
      (f) =>
        (f.type === "option" && (f as OptionFilter).options.length > 0) ||
        (f.type === "price_range" && priceBuckets.length > 0) ||
        f.type === "availability",
    ) ?? false;

  return (
    <div className="lg:flex lg:items-start lg:gap-10 xl:gap-12">
      {/* Desktop sidebar — sits below the 84px sticky header. */}
      {filtersData && hasFilterGroups && (
        <aside
          aria-label={t("filters")}
          className="sticky top-[100px] hidden max-h-[calc(100vh-124px)] w-60 shrink-0 overflow-y-auto overscroll-contain pb-8 lg:block xl:w-64"
        >
          <FilterSidebar
            filtersData={filtersData}
            activeFilters={activeFilters}
            priceBuckets={priceBuckets}
            onOptionToggle={handleOptionValueToggle}
            onPriceChange={handlePriceChange}
            onAvailabilityChange={handleAvailabilityChange}
          />
        </aside>
      )}

      <div className="min-w-0 flex-1">
        {/* Toolbar: results count left, filters (mobile) + sort right. */}
        <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
          <p className="text-sm text-muted-foreground">
            {t("productCount", { count: totalCount })}
          </p>

          <div className="flex shrink-0 items-center gap-2">
            {filtersData && hasFilterGroups && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowMobileDrawer(true)}
                className="lg:hidden"
              >
                <SlidersHorizontal />
                <span>{t("filters")}</span>
                {hasActiveFilters && (
                  <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
                    {totalActiveFilters}
                  </span>
                )}
              </Button>
            )}

            {filtersData && filtersData.sort_options.length > 0 && (
              <FilterDropdown
                label={
                  <>
                    <span className="text-muted-foreground">
                      {t("sortBy")}:
                    </span>{" "}
                    {activeSortBy ? getSortLabel(activeSortBy, t) : ""}
                  </>
                }
                isOpen={sortOpen}
                onToggle={() => setSortOpen((prev) => !prev)}
                onClose={() => setSortOpen(false)}
                align="right"
              >
                <SortDropdownContent
                  sortOptions={filtersData.sort_options}
                  activeSortBy={activeSortBy}
                  onSortChange={handleSortChange}
                />
              </FilterDropdown>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <FilterChips
            activeFilters={activeFilters}
            filtersData={filtersData}
            priceBuckets={priceBuckets}
            onRemoveOptionValue={(id) => handleOptionValueToggle(id)}
            onRemovePrice={() => handlePriceChange(undefined, undefined)}
            onRemoveAvailability={() => handleAvailabilityChange(undefined)}
            onClearAll={clearFilters}
          />
        )}

        <div className="pt-6">{children}</div>
      </div>

      {filtersData && (
        <MobileFilterDrawer
          isOpen={showMobileDrawer}
          onClose={() => setShowMobileDrawer(false)}
          filtersData={filtersData}
          activeFilters={activeFilters}
          priceBuckets={priceBuckets}
          onApply={onFilterChange}
        />
      )}
    </div>
  );
}
