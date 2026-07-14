import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { OrderList } from "@/components/account/OrderList";
import { OrderPagination } from "@/components/account/OrderPagination";
import { EmptyState } from "@/components/commerce/EmptyState";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/lib/data/orders";

const ORDERS_PER_PAGE = 50;

interface OrdersPageProps {
  params: Promise<{ country: string; locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

function parsePage(page: string | string[] | undefined): number {
  const value = Array.isArray(page) ? page[0] : page;
  if (!value || !/^[1-9]\d*$/.test(value)) return 1;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? Math.min(parsed, 10_000) : 1;
}

export default async function OrdersPage({
  params,
  searchParams,
}: OrdersPageProps) {
  await connection();
  const { country, locale } = await params;
  const { page } = await searchParams;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "orders",
  });
  const basePath = `/${country}/${locale}`;
  const requestedPage = parsePage(page);

  const orderQuery = {
    limit: ORDERS_PER_PAGE,
    sort: "completed_at desc",
    state_eq: "complete",
  } as const;
  const firstPage = await getOrders({ page: 1, ...orderQuery });
  const lastPage = Math.max(firstPage.meta.pages, 1);
  if (requestedPage > lastPage) {
    redirect(`${basePath}/account/orders?page=${lastPage}`);
  }

  const response =
    requestedPage === 1
      ? firstPage
      : await getOrders({ page: requestedPage, ...orderQuery });
  const orders = response.data;

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
        <>
          <OrderList orders={orders} basePath={basePath} locale={locale} />
          {response.meta.pages > 1 && (
            <OrderPagination
              basePath={basePath}
              currentPage={response.meta.page}
              totalPages={response.meta.pages}
              previousPage={response.meta.previous}
              nextPage={response.meta.next}
              labels={{
                pagination: t("pagination"),
                previousPage: t("previousPage"),
                nextPage: t("nextPage"),
                pageNumber: t("pageNumber", { page: "{page}" }),
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
