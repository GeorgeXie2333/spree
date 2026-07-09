import type { CenwatchContent } from "@/content/cenwatch";
import { OrderTrackingForm } from "./OrderTrackingForm";

interface OrderTrackingPageProps {
  content: CenwatchContent;
}

export function OrderTrackingPage({ content }: OrderTrackingPageProps) {
  return (
    <div className="bg-white">
      <section className="container mx-auto grid gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-600">
            {content.brand.name}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal text-neutral-950 sm:text-5xl">
            {content.tracking.title}
          </h1>
          <p className="mt-5 text-base leading-7 text-neutral-700">
            {content.tracking.text}
          </p>
          <p className="mt-5 text-sm leading-6 text-neutral-600">
            {content.tracking.helper}
          </p>
        </div>

        <OrderTrackingForm content={content} />
      </section>
    </div>
  );
}
