import type { CreditCard, Payment, StoreCredit } from "@spree/sdk";
import { useTranslations } from "next-intl";
import { PaymentIcon } from "react-svg-credit-card-payment-icons";
import { getCardIconType, getCardLabel } from "@/lib/utils/credit-card";

export function PaymentInfo({ payment }: { payment: Payment }) {
  const t = useTranslations("orders");
  const source = payment.source;

  if (payment.source_type === "credit_card" && source) {
    const card = source as CreditCard;
    return (
      <div className="flex items-center gap-3">
        <PaymentIcon
          type={getCardIconType(card.brand)}
          format="flatRounded"
          width={40}
        />
        <div>
          <p className="text-sm font-medium text-foreground">
            {t("cardEndingIn", {
              label: getCardLabel(card.brand),
              digits: card.last4,
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("cardExpires", {
              month: String(card.month).padStart(2, "0"),
              year: card.year,
            })}
          </p>
        </div>
      </div>
    );
  }

  if (payment.source_type === "store_credit" && source) {
    const credit = source as StoreCredit;
    return (
      <div>
        <p className="text-sm font-medium text-foreground">
          {t("storeCredit")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("storeCreditApplied", {
            amount: payment.display_amount,
            remaining: credit.display_amount_remaining,
          })}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-foreground">
        {payment.payment_method?.name}
      </p>
      <p className="text-xs text-muted-foreground">{payment.display_amount}</p>
    </div>
  );
}
