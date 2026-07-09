"use client";

import { useTranslations } from "next-intl";

export function OperationInstructionsPage() {
  const t = useTranslations("guide");

  const sections = [
    {
      title: t("connectionTitle"),
      steps: [t("connectionStep1"), t("connectionStep2"), t("connectionStep3")],
    },
    {
      title: t("usageTitle"),
      steps: [
        t("usageStep1"),
        t("usageStep2"),
        t("usageStep3"),
        t("usageStep4"),
      ],
    },
    {
      title: t("precautionsTitle"),
      steps: [
        t("precaution1"),
        t("precaution2"),
        t("precaution3"),
        t("precaution4"),
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          {t("intro")}
        </p>

        <div className="mt-12 divide-y divide-border">
          {sections.map((section) => (
            <section key={section.title} className="py-8 first:pt-0 last:pb-0">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {section.title}
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                {section.steps.map((step) => (
                  <p key={step}>{step}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
