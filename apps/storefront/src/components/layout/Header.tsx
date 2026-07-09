import type { Category } from "@spree/sdk";
import { User } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CartButton } from "@/components/layout/CartButton";
import { SearchToggle } from "@/components/layout/SearchToggle";
import { Button } from "@/components/ui/button";
import { getCenwatchContent } from "@/content/cenwatch";
import { getStoreName } from "@/lib/store";

const LazyMobileMenu = dynamic(
  () =>
    import("@/components/layout/MobileMenu").then((mod) => ({
      default: mod.MobileMenu,
    })),
  {
    loading: () => (
      <div className="inline-flex items-center justify-center h-10 w-10" />
    ),
  },
);

const LazyCountrySwitcher = dynamic(
  () =>
    import("@/components/layout/CountrySwitcher").then((mod) => ({
      default: mod.CountrySwitcher,
    })),
  {
    loading: () => (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  },
);

const storeName = getStoreName();

interface HeaderProps {
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

export async function Header({
  rootCategories,
  basePath,
  locale,
}: HeaderProps) {
  const t = await getTranslations({ locale, namespace: "header" });
  const content = getCenwatchContent(locale);

  return (
    <SearchToggle
      basePath={basePath}
      left={
        <div className="flex items-center gap-2">
          <LazyMobileMenu
            rootCategories={rootCategories}
            basePath={basePath}
            locale={locale}
          />
          <nav
            aria-label="Primary navigation"
            className="hidden xl:flex items-center gap-5"
          >
            {content.navigation.map((item) => (
              <Link
                key={item.href}
                href={localizedHref(basePath, item.href)}
                className="text-sm font-medium text-gray-700 hover:text-gray-950 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      }
      center={
        <Link href={basePath || "/"} className="flex items-center min-w-0">
          <Image
            src="/cenwatch/logo.jpg"
            alt={content.brand.name || storeName}
            width={120}
            height={40}
            className="max-w-full object-contain rounded-sm"
            style={{ width: "auto", height: "auto" }}
            fetchPriority="high"
            loading="eager"
          />
        </Link>
      }
      rightStart={
        <div className="hidden lg:block">
          <LazyCountrySwitcher />
        </div>
      }
      rightEnd={
        <>
          {/* Account - desktop only */}
          <div className="hidden md:block">
            <Button variant="ghost" size="icon-lg" asChild>
              <Link href={`${basePath}/account`} aria-label={t("account")}>
                <User className="size-5" />
              </Link>
            </Button>
          </div>

          {/* Cart */}
          <CartButton />
        </>
      }
    />
  );
}
