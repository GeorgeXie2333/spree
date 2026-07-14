"use client";

import type { Category } from "@spree/sdk";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface CategoryNavProps {
  rootCategories: Category[];
  basePath: string;
}

/**
 * Desktop category navigation with hover flyout panels for children,
 * in the style of the Apple Store top nav.
 */
export function CategoryNav({ rootCategories, basePath }: CategoryNavProps) {
  const t = useTranslations("header");
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <nav
      aria-label="Primary navigation"
      className="hidden lg:flex items-center gap-7"
      onMouseLeave={() => setOpenId(null)}
    >
      <Link
        href={`${basePath}/products`}
        className="text-xs font-normal text-foreground/80 transition-colors hover:text-foreground"
        onMouseEnter={() => setOpenId(null)}
      >
        {t("allProducts")}
      </Link>

      {rootCategories.map((category) => {
        const hasChildren = (category.children?.length ?? 0) > 0;
        const isOpen = openId === category.id;

        return (
          <div
            key={category.id}
            className="relative"
            onMouseEnter={() => setOpenId(hasChildren ? category.id : null)}
          >
            <Link
              href={`${basePath}/c/${category.permalink}`}
              className="text-xs font-normal text-foreground/80 transition-colors hover:text-foreground"
              aria-expanded={hasChildren ? isOpen : undefined}
              onFocus={() => setOpenId(hasChildren ? category.id : null)}
            >
              {category.name}
            </Link>

            {hasChildren && isOpen && (
              <div className="absolute top-full left-1/2 z-50 -translate-x-1/2 pt-4">
                <div className="min-w-56 rounded-2xl border border-border/40 bg-background/95 p-5 shadow-xl backdrop-blur-xl">
                  <ul className="flex flex-col gap-2.5">
                    {category.children?.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`${basePath}/c/${child.permalink}`}
                          className="block whitespace-nowrap text-sm font-medium text-foreground/90 transition-colors hover:text-link"
                          onClick={() => setOpenId(null)}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                    <li className="mt-1 border-t border-border/40 pt-2.5">
                      <Link
                        href={`${basePath}/c/${category.permalink}`}
                        className="block whitespace-nowrap text-sm text-link hover:underline"
                        onClick={() => setOpenId(null)}
                      >
                        {t("viewAllCategory", { category: category.name })}
                        <span aria-hidden="true"> ›</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
