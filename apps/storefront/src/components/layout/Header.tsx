import type { Category } from "@spree/sdk";
import { User } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CartButton } from "@/components/layout/CartButton";
import { PromoBar } from "@/components/layout/PromoBar";
import { SearchToggle } from "@/components/layout/SearchToggle";
import { Button } from "@/components/ui/button";
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
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground">
        <div className="w-4 h-4 border-2 border-border border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  },
);

const LazyLanguageSwitcher = dynamic(
  () =>
    import("@/components/layout/LanguageSwitcher").then((mod) => ({
      default: mod.LanguageSwitcher,
    })),
  {
    loading: () => (
      <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground">
        <div className="w-4 h-4 border-2 border-border border-t-transparent rounded-full animate-spin" />
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

export async function Header({
  rootCategories,
  basePath,
  locale,
}: HeaderProps) {
  const t = await getTranslations({ locale, namespace: "header" });

  return (
    <header className="sticky top-0 z-50">
      <PromoBar
        messages={[t("promoShipping"), t("promoReturns"), t("promoWarranty")]}
      />
      <SearchToggle
        basePath={basePath}
        left={
          <div className="flex items-center gap-1">
            <div className="lg:hidden">
              <LazyMobileMenu
                rootCategories={rootCategories}
                basePath={basePath}
              />
            </div>
            <Link
              href={basePath || "/"}
              className="text-[17px] font-semibold tracking-tight text-foreground"
              aria-label={storeName}
            >
              {storeName}
            </Link>
          </div>
        }
        center={null}
        rightStart={
          <div className="hidden items-center gap-1 lg:flex">
            <LazyCountrySwitcher />
            <LazyLanguageSwitcher />
          </div>
        }
        rightEnd={
          <>
            {/* Account - desktop only */}
            <div className="hidden md:block">
              <Button variant="ghost" size="icon-lg" asChild>
                <Link href={`${basePath}/account`} aria-label={t("account")}>
                  <User className="size-[18px]" />
                </Link>
              </Button>
            </div>

            {/* Cart */}
            <CartButton />
          </>
        }
      />
    </header>
  );
}
