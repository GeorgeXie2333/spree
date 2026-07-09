import type { Category } from "@spree/sdk";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCenwatchContent } from "@/content/cenwatch";
import { POLICY_LINKS } from "@/lib/constants/policies";
import { getStoreName } from "@/lib/store";
import { CurrentYear } from "./CurrentYear";

const storeName = getStoreName();

interface FooterProps {
  rootCategories: Category[];
  basePath: string;
  locale: Locale;
}

function localizedHref(basePath: string, href: string): string {
  if (/^https?:\/\//.test(href)) return href;
  if (href === "/") return basePath || "/";
  if (href.startsWith("#")) return `${basePath || "/"}${href}`;
  return `${basePath}${href.startsWith("/") ? href : `/${href}`}`;
}

export async function Footer({
  rootCategories,
  basePath,
  locale,
}: FooterProps) {
  const t = await getTranslations({ locale, namespace: "footer" });
  const tp = await getTranslations({ locale, namespace: "policies" });
  const content = getCenwatchContent(locale);

  return (
    <footer className="bg-primary text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          <div className="col-span-1 md:col-span-2">
            <span className="text-xl font-bold text-white">
              {content.brand.name || storeName}
            </span>
            <p className="mt-4 text-sm text-neutral-400">
              {content.footer.blurb || content.brand.description}
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-neutral-400">
              <span>{content.brand.tagline}</span>
              <Link
                href={`mailto:${content.brand.supportEmail}`}
                className="text-white hover:text-neutral-200 transition-colors font-medium"
              >
                {content.brand.supportEmail}
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-neutral-300">
              {content.brand.name}
            </h3>
            <ul className="mt-4 space-y-3">
              {content.navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={localizedHref(basePath, item.href)}
                    className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-neutral-300">
              {t("account")}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href={`${basePath}/account`}
                  className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  {t("myAccount")}
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePath}/account/orders`}
                  className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  {t("orderHistory")}
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePath}/cart`}
                  className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  {t("cart")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-neutral-300">
              {t("policies")}
            </h3>
            <ul className="mt-4 space-y-3">
              {POLICY_LINKS.map((policy) => (
                <li key={policy.slug}>
                  <Link
                    href={`${basePath}/policies/${policy.slug}`}
                    className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    {tp(policy.nameKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {rootCategories.length > 0 && (
          <div className="mt-8 pt-8 border-t border-neutral-800">
            <h3 className="text-sm font-medium text-neutral-300">
              {t("categories")}
            </h3>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
              {rootCategories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`${basePath}/c/${category.permalink}`}
                    className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-neutral-800 text-xs text-neutral-400 text-center">
          <p>
            &copy; <CurrentYear /> {content.brand.name || storeName}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
