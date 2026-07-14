"use client";

import type { Address, Fulfillment } from "@spree/sdk";
import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { AddressBlock } from "@/components/order/AddressBlock";
import { LineItemCard } from "@/components/order/LineItemCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getFulfillmentStatusColor } from "@/lib/utils/format";
import type { FulfillmentLineItem } from "@/lib/utils/fulfillment";

interface FulfillmentBlockProps {
  fulfillment: Fulfillment;
  shipAddress: Address | null;
  basePath: string;
  lineItems: FulfillmentLineItem[];
}

export function FulfillmentBlock({
  fulfillment,
  shipAddress,
  basePath,
  lineItems,
}: FulfillmentBlockProps) {
  const t = useTranslations("orders");
  return (
    <div className="bg-card rounded-[18px] overflow-hidden mb-4">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:gap-6 gap-4">
          {shipAddress && (
            <div className="lg:w-1/2">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                {t("deliveryAddress")}
              </h3>
              <AddressBlock address={shipAddress} />
            </div>
          )}
          <div className="lg:w-1/2 lg:flex justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                {t("shippingMethod")}
              </h3>
              <p className="text-sm text-foreground">
                {fulfillment.delivery_method?.name || t("canceled")}
              </p>
              {fulfillment.stock_location && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("shippedFrom", {
                    location: fulfillment.stock_location.name,
                  })}
                </p>
              )}
              <span
                className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-lg text-xs font-medium capitalize ${getFulfillmentStatusColor(fulfillment.status)}`}
              >
                {fulfillment.status}
              </span>
            </div>
            <div className="mt-4 lg:mt-0">
              {fulfillment.status === "shipped" && fulfillment.tracking_url ? (
                <Button size="sm" asChild>
                  <a
                    href={fulfillment.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("trackItems")}
                  </a>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  {t("trackItems")}
                </Button>
              )}
            </div>
          </div>
        </div>

        {fulfillment.status === "canceled" && !fulfillment.fulfilled_at && (
          <Alert variant="destructive" className="mt-3">
            <CircleAlert />
            <AlertDescription>{t("shipmentCanceledRefund")}</AlertDescription>
          </Alert>
        )}
        {fulfillment.status !== "canceled" &&
          fulfillment.status !== "shipped" &&
          !fulfillment.tracking && (
            <div className="mt-3 p-3 bg-background rounded-xl text-sm text-muted-foreground text-center">
              {t("noTrackingInfo")}
            </div>
          )}
      </div>

      <div className="divide-y divide-border">
        {lineItems.map(({ item, quantity, displayTotal }) => (
          <div key={item.id} className="px-6 py-4">
            <LineItemCard
              item={item}
              basePath={basePath}
              quantity={quantity}
              displayTotal={displayTotal}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
