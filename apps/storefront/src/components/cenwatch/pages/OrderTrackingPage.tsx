"use client";

import { useTranslations } from "next-intl";
import { OrderTrackingForm } from "./OrderTrackingForm";

export function OrderTrackingPage() {
  const t = useTranslations("tracking");

  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-base text-muted-foreground">{t("intro")}</p>
        <p className="mt-3 text-sm text-muted-foreground">{t("helper")}</p>
      </div>

      <div className="mx-auto mt-10 max-w-md">
        <OrderTrackingForm />
      </div>
    </div>
  );
}
