"use client";

import type { OptionType, Variant } from "@spree/sdk";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface VariantPickerProps {
  variants: Variant[];
  optionTypes: OptionType[];
  selectedVariant: Variant | null;
  onVariantChange: (variant: Variant | null) => void;
}

export function VariantPicker({
  variants,
  optionTypes,
  selectedVariant,
  onVariantChange,
}: VariantPickerProps) {
  const t = useTranslations("pdp");
  const optionValuesMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};

    optionTypes.forEach((optionType) => {
      map[optionType.id] = new Set();
    });

    variants.forEach((variant) => {
      variant.option_values.forEach((optionValue) => {
        if (map[optionValue.option_type_id]) {
          map[optionValue.option_type_id].add(optionValue.name);
        }
      });
    });

    return map;
  }, [variants, optionTypes]);

  const selectedOptions = useMemo(() => {
    const options: Record<string, string> = {};
    if (selectedVariant) {
      selectedVariant.option_values.forEach((ov) => {
        options[ov.option_type_id] = ov.name;
      });
    }
    return options;
  }, [selectedVariant]);

  const { variantOptionMaps, optionValueDetailsMap } = useMemo(() => {
    const maps = variants.map((variant) => {
      const optionsMap: Record<string, string> = {};
      variant.option_values.forEach((ov) => {
        optionsMap[ov.option_type_id] = ov.name;
      });
      return { variant, optionsMap };
    });

    const detailsMap: Record<string, (typeof variants)[0]["option_values"][0]> =
      {};
    for (const variant of variants) {
      for (const ov of variant.option_values) {
        const key = `${ov.option_type_id}:${ov.name}`;
        if (!detailsMap[key]) {
          detailsMap[key] = ov;
        }
      }
    }

    return { variantOptionMaps: maps, optionValueDetailsMap: detailsMap };
  }, [variants]);

  const findReachableVariant = (
    optionTypeId: string,
    optionValue: string,
  ): Variant | null => {
    const remainingSelections = Object.entries(selectedOptions).filter(
      ([typeId]) => typeId !== optionTypeId,
    );
    const candidates = variantOptionMaps.filter(
      ({ optionsMap }) => optionsMap[optionTypeId] === optionValue,
    );

    if (candidates.length === 0) return null;

    // Preserve as many existing selections as possible. A sparse variant
    // matrix can require changing one or more other options to reach a valid
    // variant, so never require the current full combination to exist.
    return candidates.reduce((best, candidate) => {
      const matchingSelections = remainingSelections.filter(
        ([typeId, value]) => candidate.optionsMap[typeId] === value,
      ).length;
      const bestMatchingSelections = remainingSelections.filter(
        ([typeId, value]) => best.optionsMap[typeId] === value,
      ).length;

      if (matchingSelections > bestMatchingSelections) return candidate;
      if (
        matchingSelections === bestMatchingSelections &&
        candidate.variant.purchasable &&
        !best.variant.purchasable
      ) {
        return candidate;
      }

      return best;
    }).variant;
  };

  const isOptionAvailable = (
    optionTypeId: string,
    optionValue: string,
  ): boolean => {
    return variantOptionMaps.some(
      ({ optionsMap }) => optionsMap[optionTypeId] === optionValue,
    );
  };

  const isOptionPurchasable = (
    optionTypeId: string,
    optionValue: string,
  ): boolean => {
    return variantOptionMaps.some(
      ({ variant, optionsMap }) =>
        variant.purchasable && optionsMap[optionTypeId] === optionValue,
    );
  };

  const handleOptionSelect = (optionTypeId: string, optionValue: string) => {
    const newVariant = findReachableVariant(optionTypeId, optionValue);
    if (newVariant) onVariantChange(newVariant);
  };

  const getOptionValueDetails = (
    optionTypeId: string,
    optionValueName: string,
  ): Variant["option_values"][0] | null => {
    return optionValueDetailsMap[`${optionTypeId}:${optionValueName}`] || null;
  };

  if (optionTypes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-7">
      {optionTypes.map((optionType) => {
        const values = Array.from(optionValuesMap[optionType.id] || []);
        const selectedValue = selectedOptions[optionType.id];
        const selectedLabel = selectedValue
          ? getOptionValueDetails(optionType.id, selectedValue)?.label ||
            selectedValue
          : null;
        const isColor = optionType.kind === "color_swatch";

        return (
          <div key={optionType.id}>
            {/* "Label: value" row, Apple style */}
            <p className="mb-3 text-sm font-medium text-foreground">
              {selectedLabel
                ? t.rich("optionLabel", {
                    label: optionType.label,
                    value: selectedLabel,
                    muted: (chunks) => (
                      <span className="font-normal text-muted-foreground">
                        {chunks}
                      </span>
                    ),
                  })
                : optionType.label}
            </p>

            {isColor ? (
              <div className="flex flex-wrap items-center gap-3">
                {values.map((value) => {
                  const optionValue = getOptionValueDetails(
                    optionType.id,
                    value,
                  );
                  const isSelected = selectedValue === value;
                  const isAvailable = isOptionAvailable(optionType.id, value);
                  const isPurchasable = isOptionPurchasable(
                    optionType.id,
                    value,
                  );

                  return (
                    <button
                      type="button"
                      key={value}
                      onClick={() => handleOptionSelect(optionType.id, value)}
                      disabled={!isAvailable}
                      title={optionValue?.label || value}
                      aria-label={optionValue?.label || value}
                      aria-pressed={isSelected}
                      className={cn(
                        "relative size-8 overflow-hidden rounded-full border border-border transition-shadow duration-200",
                        isSelected
                          ? "ring-2 ring-primary ring-offset-2"
                          : "hover:ring-2 hover:ring-border hover:ring-offset-2",
                        !isAvailable && "cursor-not-allowed opacity-40",
                        !isPurchasable && isAvailable && "opacity-40",
                      )}
                      style={
                        optionValue?.image_url
                          ? {
                              backgroundImage: `url(${optionValue.image_url})`,
                              backgroundSize: "cover",
                            }
                          : optionValue?.color_code
                            ? { backgroundColor: optionValue.color_code }
                            : { backgroundColor: "#e8e8ed" }
                      }
                    >
                      {!isPurchasable && isAvailable && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="absolute h-px w-full rotate-45 bg-muted-foreground" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              // Apple-style bordered selection blocks for buttons/dropdown kinds
              <div className="grid grid-cols-2 gap-2">
                {values.map((value) => {
                  const optionValue = getOptionValueDetails(
                    optionType.id,
                    value,
                  );
                  const isSelected = selectedValue === value;
                  const isAvailable = isOptionAvailable(optionType.id, value);
                  const isPurchasable = isOptionPurchasable(
                    optionType.id,
                    value,
                  );

                  return (
                    <button
                      type="button"
                      key={value}
                      onClick={() => handleOptionSelect(optionType.id, value)}
                      disabled={!isAvailable}
                      aria-pressed={isSelected}
                      className={cn(
                        "rounded-xl border bg-background px-4 py-3 text-left text-sm font-medium text-foreground transition-colors duration-200",
                        isSelected
                          ? "border-2 border-primary bg-primary/[0.04]"
                          : "border-border hover:border-muted-foreground",
                        (!isAvailable || !isPurchasable) &&
                          "opacity-40 hover:border-border",
                        !isAvailable && "cursor-not-allowed",
                      )}
                    >
                      <span
                        className={cn(
                          (!isAvailable || !isPurchasable) && "line-through",
                        )}
                      >
                        {optionValue?.label || value}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
