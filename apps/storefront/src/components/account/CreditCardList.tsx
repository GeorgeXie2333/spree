"use client";

import type { CreditCard as SpreeCreditCard } from "@spree/sdk";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PaymentIcon } from "react-svg-credit-card-payment-icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteCreditCard } from "@/lib/data/credit-cards";
import { getCardIconType, getCardLabel } from "@/lib/utils/credit-card";

function CreditCardItem({
  card,
  onDelete,
}: {
  card: SpreeCreditCard;
  onDelete: () => void;
}) {
  const t = useTranslations("creditCards");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-[18px] bg-card p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <PaymentIcon
            type={getCardIconType(card.brand)}
            format="flatRounded"
            width={48}
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
                year: String(card.year),
              })}
            </p>
            {card.name && (
              <p className="mt-1 text-sm text-muted-foreground">{card.name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {card.default && (
            <span className="text-xs font-medium text-muted-foreground">
              {t("default")}
            </span>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting}>
                {deleting ? t("removing") : t("remove")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("removePaymentMethodTitle")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("confirmRemoveDescription", {
                    label: getCardLabel(card.brand),
                    digits: card.last4,
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                  {t("remove")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

interface CreditCardListProps {
  initialCards: SpreeCreditCard[];
}

export function CreditCardList({ initialCards }: CreditCardListProps) {
  const t = useTranslations("creditCards");
  const [cards, setCards] = useState<SpreeCreditCard[]>(initialCards);

  const handleDelete = async (id: string) => {
    const result = await deleteCreditCard(id);
    if (result.success) {
      setCards((prev) => prev.filter((card) => card.id !== id));
    } else {
      alert(t("failedToRemove"));
    }
  };

  return (
    <div className="space-y-4">
      {cards.map((card) => (
        <CreditCardItem
          key={card.id}
          card={card}
          onDelete={() => handleDelete(card.id)}
        />
      ))}
    </div>
  );
}
