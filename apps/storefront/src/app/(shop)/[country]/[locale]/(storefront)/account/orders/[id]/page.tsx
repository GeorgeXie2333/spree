import Link from "next/link";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { OrderDetail } from "@/components/account/OrderDetail";
import { getOrder } from "@/lib/data/orders";

interface OrderDetailPageProps {
  params: Promise<{
    country: string;
    locale: string;
    id: string;
  }>;
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  await connection();
  const { country, locale, id } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "orders",
  });
  const basePath = `/${country}/${locale}`;
  const order = await getOrder(id);

  if (!order || order.completed_at === null) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {t("orderNotFound")}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {t("orderNotFoundDescription")}
        </p>
        <Link
          href={`${basePath}/account/orders`}
          className="mt-6 inline-block text-sm text-link hover:underline"
        >
          {t("backToOrders")}
          <span aria-hidden="true"> ›</span>
        </Link>
      </div>
    );
  }

  return <OrderDetail order={order} basePath={basePath} locale={locale} />;
}
