import type { Order } from "@spree/sdk";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AddressBlock } from "@/components/order/AddressBlock";
import { FulfillmentBlock } from "@/components/order/FulfillmentBlock";
import { LineItemCard } from "@/components/order/LineItemCard";
import { OrderTotals } from "@/components/order/OrderTotals";
import { PaymentInfo } from "@/components/order/PaymentInfo";
import { formatDateTime } from "@/lib/utils/format";

interface OrderDetailProps {
  order: Order;
  basePath: string;
  locale: string;
}

export async function OrderDetail({
  order,
  basePath,
  locale,
}: OrderDetailProps) {
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "orders",
  });
  const hasFulfillments = order.fulfillments && order.fulfillments.length > 0;

  return (
    <div>
      <Link
        href={`${basePath}/account/orders`}
        className="mb-4 inline-flex items-center text-sm text-link hover:underline"
      >
        {t("backToOrders")}
        <span aria-hidden="true"> ›</span>
      </Link>

      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        {t("orderTitle", { number: order.number })}
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        {t("placedOn", { date: formatDateTime(order.completed_at, locale) })}
      </p>

      {hasFulfillments ? (
        order.fulfillments.map((fulfillment) => {
          const manifestItemIds = new Set(
            fulfillment.items?.map((i) => i.item_id) ?? [],
          );
          const fulfillmentLineItems =
            manifestItemIds.size > 0
              ? (order.items || []).filter((item) =>
                  manifestItemIds.has(item.id),
                )
              : order.items || [];

          return (
            <FulfillmentBlock
              key={fulfillment.id}
              fulfillment={fulfillment}
              shipAddress={order.shipping_address}
              basePath={basePath}
              lineItems={fulfillmentLineItems}
            />
          );
        })
      ) : (
        <div className="mb-4 overflow-hidden rounded-[18px] bg-card">
          <div className="divide-y divide-border">
            {order.items?.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <LineItemCard item={item} basePath={basePath} />
              </div>
            ))}
          </div>
        </div>
      )}

      {order.customer_note && (
        <div className="mb-4 rounded-[18px] bg-card p-6">
          <h3 className="mb-2 text-sm font-semibold tracking-tight text-foreground">
            {t("specialInstructions")}
          </h3>
          <p className="text-sm text-foreground">{order.customer_note}</p>
        </div>
      )}

      <div className="mb-4 overflow-hidden rounded-[18px] bg-card">
        <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          {order.billing_address && (
            <div className="px-6 py-4">
              <h3 className="mb-2 text-sm font-semibold tracking-tight text-foreground">
                {t("billingAddress")}
              </h3>
              <AddressBlock address={order.billing_address} />
            </div>
          )}
          {order.payments && order.payments.length > 0 && (
            <div className="px-6 py-4">
              <h3 className="mb-2 text-sm font-semibold tracking-tight text-foreground">
                {t("paymentInformation")}
              </h3>
              {order.payments
                .filter((p) => p.status !== "void" && p.status !== "invalid")
                .map((payment) => (
                  <div key={payment.id} className="mb-3 last:mb-0">
                    <PaymentInfo payment={payment} />
                    <p className="mt-1 text-sm text-muted-foreground">
                      {payment.display_amount}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[18px] bg-card p-6">
        <OrderTotals order={order} />
      </div>
    </div>
  );
}
