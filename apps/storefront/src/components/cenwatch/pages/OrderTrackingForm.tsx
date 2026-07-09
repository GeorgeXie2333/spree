"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type TrackingResult =
  | {
      ok: false;
      message?: string;
    }
  | {
      ok: true;
      order_number: string;
      order_status?: string;
      payment_state?: string;
      shipment_state?: string;
      shipments?: Array<{
        status?: string;
        tracking_number?: string;
        tracking_url?: string;
        carrier?: string;
      }>;
    };

export function OrderTrackingForm() {
  const t = useTranslations("tracking");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/v3/store/order_tracking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          order_number: formData.get("order_number"),
          email: formData.get("email"),
        }),
      });
      const body = (await response.json()) as TrackingResult;
      if (body.ok) {
        setResult(body);
      } else {
        setResult({
          ok: false,
          message:
            response.status === 503 ? t("unavailable") : t("genericFailure"),
        });
      }
    } catch {
      setResult({ ok: false, message: t("unavailable") });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      aria-label={t("title")}
      className="rounded-[18px] bg-card p-6 sm:p-8"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4">
        <Field>
          <FieldLabel htmlFor="tracking-order-number">
            {t("orderNumberLabel")}
          </FieldLabel>
          <Input
            id="tracking-order-number"
            name="order_number"
            autoComplete="off"
            placeholder="R123456789"
            required
            className="rounded-xl border-border bg-white"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="tracking-email">{t("emailLabel")}</FieldLabel>
          <Input
            id="tracking-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-xl border-border bg-white"
          />
        </Field>
      </div>
      <Button type="submit" disabled={isSubmitting} size="lg" className="mt-6">
        {isSubmitting ? t("loading") : t("submit")}
      </Button>

      {result ? (
        <section
          aria-live="polite"
          className="mt-6 rounded-[14px] bg-white p-4 text-sm leading-6 text-foreground"
        >
          <h2 className="text-sm font-semibold tracking-tight">
            {t("resultHeading")}
          </h2>
          {result.ok ? (
            <div className="mt-3 grid gap-2 text-muted-foreground">
              <p>
                <span className="text-foreground">{t("resultOrder")}: </span>
                {result.order_number}
              </p>
              {result.order_status ? (
                <p>
                  <span className="text-foreground">{t("resultStatus")}: </span>
                  {result.order_status}
                </p>
              ) : null}
              {result.payment_state ? (
                <p>
                  <span className="text-foreground">
                    {t("resultPayment")}:{" "}
                  </span>
                  {result.payment_state}
                </p>
              ) : null}
              {result.shipment_state ? (
                <p>
                  <span className="text-foreground">
                    {t("resultShipment")}:{" "}
                  </span>
                  {result.shipment_state}
                </p>
              ) : null}
              {result.shipments?.map((shipment) => (
                <p key={`${shipment.tracking_number}-${shipment.status}`}>
                  {shipment.carrier ? `${shipment.carrier}: ` : ""}
                  {shipment.tracking_url ? (
                    <a
                      className="text-link hover:underline"
                      href={shipment.tracking_url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {shipment.tracking_number ?? shipment.status}
                    </a>
                  ) : (
                    (shipment.tracking_number ?? shipment.status)
                  )}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-muted-foreground">
              {result.message || t("genericFailure")}
            </p>
          )}
        </section>
      ) : null}
    </form>
  );
}
