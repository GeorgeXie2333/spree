import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { OrderList } from "@/components/account/OrderList";
import { EmptyState } from "@/components/commerce/EmptyState";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/lib/data/orders";

interface OrdersPageProps {
  params: Promise<{ country: string; locale: string }>;
}

export default async function OrdersPage({ params }: OrdersPageProps) {
  await connection();
  const { country, locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "orders",
  });
  const basePath = `/${country}/${locale}`;

  const response = await getOrders({ limit: 50 });
  const orders = response.data.filter((order) => order.completed_at !== null);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-foreground">
        {t("orderHistory")}
      </h1>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag />}
          title={t("noOrders")}
          description={t("noOrdersDescription")}
          action={
            <Button asChild>
              <Link href={`${basePath}/products`}>{t("startShopping")}</Link>
            </Button>
          }
        />
      ) : (
        <OrderList orders={orders} basePath={basePath} locale={locale} />
      )}
    </div>
  );
}
