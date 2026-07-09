import { CreditCard, Lock } from "lucide-react";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { CreditCardList } from "@/components/account/CreditCardList";
import { EmptyState } from "@/components/commerce/EmptyState";
import { getCreditCards } from "@/lib/data/credit-cards";

interface CreditCardsPageProps {
  params: Promise<{ country: string; locale: string }>;
}

export default async function CreditCardsPage({
  params,
}: CreditCardsPageProps) {
  await connection();
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "creditCards",
  });
  const response = await getCreditCards();
  const cards = response.data;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-foreground">
        {t("paymentMethods")}
      </h1>

      {cards.length === 0 ? (
        <EmptyState
          icon={<CreditCard />}
          title={t("noCards")}
          description={t("noCardsDescription")}
        />
      ) : (
        <CreditCardList initialCards={cards} />
      )}

      <div className="mt-6 rounded-[18px] bg-card px-5 py-4">
        <p className="text-sm text-muted-foreground">
          <Lock className="mr-1 inline h-4 w-4" />
          {t("secureInfo")}
        </p>
      </div>
    </div>
  );
}
