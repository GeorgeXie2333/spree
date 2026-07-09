import type { Metadata } from "next";
import { OrderTrackingPage } from "@/components/cenwatch/pages/OrderTrackingPage";
import { getCenwatchContent } from "@/content/cenwatch";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const content = getCenwatchContent(locale);

  return {
    title: content.tracking.title,
    description: content.tracking.text,
  };
}

export default async function OrderTrackingRoute({ params }: PageProps) {
  const { locale } = await params;
  return <OrderTrackingPage content={getCenwatchContent(locale)} />;
}
