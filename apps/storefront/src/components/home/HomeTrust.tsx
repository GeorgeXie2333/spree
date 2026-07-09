import { Headphones, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/commerce/SectionHeader";
import { TrustStrip } from "@/components/commerce/TrustStrip";

interface HomeTrustProps {
  locale: Locale;
}

/** Trust signals strip: shipping, returns, warranty, support. */
export async function HomeTrust({ locale }: HomeTrustProps) {
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <SectionHeader
        title={t("trustTitle")}
        subtitle={t("trustSubtitle")}
        className="mb-8"
      />
      <div className="rounded-[18px] bg-card p-10">
        <TrustStrip
          items={[
            {
              icon: <Truck />,
              title: t("trustShippingTitle"),
              text: t("trustShippingText"),
            },
            {
              icon: <RotateCcw />,
              title: t("trustReturnsTitle"),
              text: t("trustReturnsText"),
            },
            {
              icon: <ShieldCheck />,
              title: t("trustWarrantyTitle"),
              text: t("trustWarrantyText"),
            },
            {
              icon: <Headphones />,
              title: t("trustSupportTitle"),
              text: t("trustSupportText"),
            },
          ]}
        />
      </div>
    </section>
  );
}
