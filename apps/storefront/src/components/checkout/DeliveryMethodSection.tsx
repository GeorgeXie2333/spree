"use client";

import type { Fulfillment } from "@spree/sdk";
import { useTranslations } from "next-intl";
import { Field, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface DeliveryMethodSectionProps {
  fulfillments: Fulfillment[];
  onDeliveryRateSelect: (
    fulfillmentId: string,
    rateId: string,
  ) => Promise<void>;
  processing: boolean;
  errors?: string[];
}

export function DeliveryMethodSection({
  fulfillments,
  onDeliveryRateSelect,
  processing,
  errors,
}: DeliveryMethodSectionProps) {
  const t = useTranslations("checkout");

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-foreground mb-3">
        {t("shippingMethod")}
      </h2>

      {errors && errors.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 mb-3">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-destructive">
              {error}
            </p>
          ))}
        </div>
      )}

      {fulfillments.length === 0 ? (
        <div className="rounded-xl bg-card px-4 py-3.5 text-sm text-muted-foreground">
          {t("enterShippingAddressForMethods")}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {fulfillments.map((fulfillment, index) => {
            const selectedRate = fulfillment.delivery_rates.find(
              (r) => r.selected,
            );
            return (
              <div key={fulfillment.id}>
                {fulfillments.length > 1 && (
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {t("shipmentOf", {
                      current: index + 1,
                      total: fulfillments.length,
                    })}
                    {fulfillment.stock_location?.name && (
                      <span className="font-normal">
                        {" "}
                        &mdash;{" "}
                        {t("shipsFrom", {
                          location: fulfillment.stock_location.name,
                        })}
                      </span>
                    )}
                  </p>
                )}
                <RadioGroup
                  value={selectedRate?.id ?? ""}
                  onValueChange={(rateId) =>
                    onDeliveryRateSelect(fulfillment.id, rateId)
                  }
                  disabled={processing}
                  className="gap-3"
                  aria-label={t("shippingMethod")}
                >
                  {fulfillment.delivery_rates.map((rate) => {
                    const radioId = `delivery-rate-${fulfillment.id}-${rate.id}`;
                    return (
                      <Field
                        key={rate.id}
                        orientation="horizontal"
                        className={cn(
                          "relative cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors duration-200",
                          rate.selected
                            ? "border-2 border-primary bg-primary/[0.04]"
                            : "border-border bg-background hover:bg-card",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem
                            id={radioId}
                            value={rate.id}
                            className="relative z-10"
                          />
                          <FieldLabel
                            htmlFor={radioId}
                            className="absolute inset-0 cursor-pointer"
                          >
                            <span className="sr-only">{rate.name}</span>
                          </FieldLabel>
                          <span>{rate.name}</span>
                        </div>
                        <span className="text-sm text-foreground">
                          {rate.display_cost}
                        </span>
                      </Field>
                    );
                  })}
                </RadioGroup>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
