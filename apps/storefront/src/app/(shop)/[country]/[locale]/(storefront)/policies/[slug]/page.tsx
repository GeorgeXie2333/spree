import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPolicy } from "@/lib/data/policies";
import { getStoreName } from "@/lib/store";

interface PolicyPageProps {
  params: Promise<{
    country: string;
    locale: string;
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: PolicyPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const policy = await getPolicy(slug);

  const storeName = getStoreName();

  if (!policy) {
    const t = await getTranslations({
      locale: locale as Locale,
      namespace: "policies",
    });
    return {
      title: t("policyNotFound"),
      description: t("noContent"),
    };
  }

  return {
    title: storeName ? `${policy.name} | ${storeName}` : policy.name,
    description: `${policy.name} — ${storeName}`,
    openGraph: {
      title: policy.name,
      description: `${policy.name} — ${storeName}`,
    },
  };
}

export default async function PolicyPage({
  params,
}: PolicyPageProps): Promise<React.JSX.Element> {
  const { slug, locale } = await params;
  const [policy, t] = await Promise.all([
    getPolicy(slug),
    getTranslations({ locale: locale as Locale, namespace: "policies" }),
  ]);

  if (!policy) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight text-muted-foreground md:text-4xl">
        {policy.name}
      </h1>
      {policy.body_html ? (
        <div
          className="space-y-4 text-base leading-7 text-foreground [&_a]:text-link [&_a]:hover:underline [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: policy.body_html }}
        />
      ) : policy.body ? (
        <div className="whitespace-pre-wrap text-base leading-7 text-foreground">
          {policy.body}
        </div>
      ) : (
        <p className="text-muted-foreground">{t("noContent")}</p>
      )}
    </div>
  );
}
