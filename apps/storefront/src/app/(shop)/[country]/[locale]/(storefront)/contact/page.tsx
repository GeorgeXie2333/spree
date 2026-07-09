import type { Metadata } from "next";
import { ContactPage } from "@/components/cenwatch/pages/ContactPage";
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
    title: content.contact.title,
    description: content.contact.text,
  };
}

export default async function ContactRoute({ params }: PageProps) {
  const { locale } = await params;
  return <ContactPage content={getCenwatchContent(locale)} />;
}
