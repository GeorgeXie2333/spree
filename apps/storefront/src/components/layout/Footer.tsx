import type { Category } from "@spree/sdk";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { POLICY_LINKS } from "@/lib/constants/policies";
import { siteConfig } from "@/lib/site-config";
import { getStoreName } from "@/lib/store";
import { CurrentYear } from "./CurrentYear";

const storeName = getStoreName();

interface FooterProps {
  rootCategories: Category[];
  basePath: string;
  locale: Locale;
}

const columnHeadingClass = "text-xs font-semibold text-foreground";
const columnLinkClass =
  "text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline";

export async function Footer({
  rootCategories,
  basePath,
  locale,
}: FooterProps) {
  const t = await getTranslations({ locale, namespace: "footer" });
  const tp = await getTranslations({ locale, namespace: "policies" });

  return (
    <footer className="bg-card text-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className={columnHeadingClass}>{t("shop")}</h3>
            <ul className="mt-3 space-y-2.5">
              <li>
                <Link href={`${basePath}/products`} className={columnLinkClass}>
                  {t("allProducts")}
                </Link>
              </li>
              {rootCategories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`${basePath}/c/${category.permalink}`}
                    className={columnLinkClass}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={columnHeadingClass}>{t("account")}</h3>
            <ul className="mt-3 space-y-2.5">
              <li>
                <Link href={`${basePath}/account`} className={columnLinkClass}>
                  {t("myAccount")}
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePath}/account/orders`}
                  className={columnLinkClass}
                >
                  {t("orderHistory")}
                </Link>
              </li>
              <li>
                <Link href={`${basePath}/cart`} className={columnLinkClass}>
                  {t("cart")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={columnHeadingClass}>{t("help")}</h3>
            <ul className="mt-3 space-y-2.5">
              <li>
                <Link href={`${basePath}/contact`} className={columnLinkClass}>
                  {t("contact")}
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePath}/order-tracking`}
                  className={columnLinkClass}
                >
                  {t("orderTracking")}
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePath}/operation-instructions`}
                  className={columnLinkClass}
                >
                  {t("userGuide")}
                </Link>
              </li>
              <li>
                <Link
                  href={`mailto:${siteConfig.supportEmail}`}
                  className={columnLinkClass}
                >
                  {siteConfig.supportEmail}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={columnHeadingClass}>{t("policies")}</h3>
            <ul className="mt-3 space-y-2.5">
              {POLICY_LINKS.map((policy) => (
                <li key={policy.slug}>
                  <Link
                    href={`${basePath}/policies/${policy.slug}`}
                    className={columnLinkClass}
                  >
                    {tp(policy.nameKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Fine print */}
        <div className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          <p>
            &copy; <CurrentYear /> {storeName}. {t("allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
}
