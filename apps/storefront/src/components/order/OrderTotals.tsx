import type { Cart, Order } from "@spree/sdk";
import { useTranslations } from "next-intl";

type OrderLike = Cart | Order;

interface OrderTotalsProps {
  order: OrderLike;
}

export function OrderTotals({ order }: OrderTotalsProps) {
  const t = useTranslations("common");

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{t("subtotal")}</span>
        <span className="text-foreground">{order.display_item_total}</span>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{t("shipping")}</span>
        <span className="text-foreground">{order.display_delivery_total}</span>
      </div>

      {order.discount_total &&
        Number.parseFloat(order.discount_total) !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("discount")}</span>
            <span className="text-foreground">
              {order.display_discount_total}
            </span>
          </div>
        )}

      {Number.parseFloat(order.tax_total) > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("tax")}</span>
          <span className="text-foreground">{order.display_tax_total}</span>
        </div>
      )}

      <div className="flex justify-between pt-2 border-t border-border">
        <span className="font-semibold text-foreground">{t("total")}</span>
        <span className="font-semibold text-foreground">
          {order.display_total}
        </span>
      </div>

      {order.store_credit_total &&
      Number.parseFloat(order.store_credit_total) > 0 ? (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("storeCredit")}</span>
          <span className="text-foreground">
            -{order.display_store_credit_total}
          </span>
        </div>
      ) : null}

      {Number.parseFloat(order.amount_due) > 0 &&
        order.amount_due !== order.total && (
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="font-semibold text-foreground">
              {t("amountDue")}
            </span>
            <span className="font-semibold text-foreground">
              {order.display_amount_due}
            </span>
          </div>
        )}
    </div>
  );
}
