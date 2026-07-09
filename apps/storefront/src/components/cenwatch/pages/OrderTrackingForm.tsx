"use client";

import { useState } from "react";
import type { CenwatchContent } from "@/content/cenwatch";

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

interface OrderTrackingFormProps {
  content: CenwatchContent;
}

export function OrderTrackingForm({ content }: OrderTrackingFormProps) {
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
            response.status === 503
              ? content.tracking.unavailable
              : content.tracking.genericFailure,
        });
      }
    } catch {
      setResult({ ok: false, message: content.tracking.unavailable });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      aria-label={content.tracking.title}
      className="rounded-lg border border-neutral-200 bg-neutral-50 p-5 shadow-sm sm:p-6"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-neutral-800">
          {content.tracking.orderNumber}
          <input
            name="order_number"
            className="h-11 rounded-md border border-neutral-300 bg-white px-3 text-base outline-none focus:border-neutral-950"
            autoComplete="off"
            placeholder="R123456789"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-neutral-800">
          {content.tracking.email}
          <input
            name="email"
            type="email"
            required
            className="h-11 rounded-md border border-neutral-300 bg-white px-3 text-base outline-none focus:border-neutral-950"
            autoComplete="email"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 h-11 rounded-md bg-neutral-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? content.tracking.loading : content.tracking.submit}
      </button>

      {result ? (
        <section
          aria-live="polite"
          className="mt-5 rounded-md border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950"
        >
          <h2 className="text-sm font-semibold">
            {content.tracking.resultHeading}
          </h2>
          {result.ok ? (
            <div className="mt-3 grid gap-2">
              <p>{result.order_number}</p>
              {result.order_status ? <p>{result.order_status}</p> : null}
              {result.payment_state ? <p>{result.payment_state}</p> : null}
              {result.shipment_state ? <p>{result.shipment_state}</p> : null}
              {result.shipments?.map((shipment) => (
                <p key={`${shipment.tracking_number}-${shipment.status}`}>
                  {shipment.carrier ? `${shipment.carrier}: ` : ""}
                  {shipment.tracking_url ? (
                    <a
                      className="font-semibold underline"
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
            <p className="mt-3">
              {result.message || content.tracking.genericFailure}
            </p>
          )}
        </section>
      ) : null}
    </form>
  );
}
