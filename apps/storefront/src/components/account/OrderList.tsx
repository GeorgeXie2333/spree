import type { Order } from "@spree/sdk";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/utils/format";

function getStatusLabel(
  status: string | null,
  t: (key: string) => string,
): string {
  if (!status) return t("notAvailable");
  const key = status.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  try {
    return t(key);
  } catch {
    return status.replace(/_/g, " ");
  }
}

/** Quiet colored text labels — not badge pills. */
function paymentStatusClass(state: string | null): string {
  switch (state) {
    case "paid":
      return "text-green-600";
    case "balance_due":
    case "pending":
      return "text-muted-foreground";
    case "failed":
    case "void":
      return "text-red-600";
    default:
      return "text-muted-foreground";
  }
}

function fulfillmentStatusClass(state: string | null): string {
  switch (state) {
    case "shipped":
    case "delivered":
      return "text-green-600";
    case "ready":
    case "pending":
      return "text-muted-foreground";
    case "canceled":
      return "text-red-600";
    default:
      return "text-muted-foreground";
  }
}

interface OrderListProps {
  orders: Order[];
  basePath: string;
  locale: string;
}

export async function OrderList({ orders, basePath, locale }: OrderListProps) {
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "orders",
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-2 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t("order")}
            </th>
            <th className="px-2 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t("date")}
            </th>
            <th className="px-2 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t("payment")}
            </th>
            <th className="px-2 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t("shipment")}
            </th>
            <th className="px-2 py-3 text-right text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t("totalColumn")}
            </th>
            <th className="px-2 py-3 text-right text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <span className="sr-only">{t("actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="border-b border-border last:border-b-0"
            >
              <td className="px-2 py-4 whitespace-nowrap">
                <Link
                  href={`${basePath}/account/orders/${order.id}`}
                  className="text-sm font-medium text-link hover:underline"
                >
                  #{order.number}
                </Link>
              </td>
              <td className="px-2 py-4 whitespace-nowrap">
                <span className="text-sm text-muted-foreground">
                  {formatDate(order.completed_at, "-", locale)}
                </span>
              </td>
              <td className="px-2 py-4 whitespace-nowrap">
                <span
                  className={`text-sm capitalize ${paymentStatusClass(order.payment_status ?? null)}`}
                >
                  {getStatusLabel(order.payment_status ?? null, t)}
                </span>
              </td>
              <td className="px-2 py-4 whitespace-nowrap">
                <span
                  className={`text-sm capitalize ${fulfillmentStatusClass(order.fulfillment_status ?? null)}`}
                >
                  {getStatusLabel(order.fulfillment_status ?? null, t)}
                </span>
              </td>
              <td className="px-2 py-4 text-right whitespace-nowrap">
                <span className="text-sm font-medium text-foreground">
                  {order.display_total}
                </span>
              </td>
              <td className="px-2 py-4 text-right whitespace-nowrap">
                <Link
                  href={`${basePath}/account/orders/${order.id}`}
                  className="text-sm text-link hover:underline"
                >
                  {t("view")}
                  <span aria-hidden="true"> ›</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
