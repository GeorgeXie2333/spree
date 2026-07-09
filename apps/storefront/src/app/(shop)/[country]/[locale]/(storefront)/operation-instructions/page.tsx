import type { Metadata } from "next";
import { OperationInstructionsPage } from "@/components/cenwatch/pages/OperationInstructionsPage";
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
    title: content.instructions.title,
    description: content.instructions.intro,
  };
}

export default async function OperationInstructionsRoute({
  params,
}: PageProps) {
  const { locale } = await params;
  return <OperationInstructionsPage content={getCenwatchContent(locale)} />;
}
