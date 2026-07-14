"use client";

import type { Order } from "@spree/sdk";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ProductImage } from "@/components/ui/product-image";

interface LineItemCardProps {
  item: Order["items"][number];
  basePath: string;
  quantity?: number;
  displayTotal?: string;
}

export function LineItemCard({
  item,
  basePath,
  quantity = item.quantity,
  displayTotal = item.display_total,
}: LineItemCardProps) {
  const t = useTranslations("orders");
  return (
    <div className="flex gap-4">
      <Link
        href={`${basePath}/products/${item.slug}`}
        className="relative w-24 h-24 bg-card rounded-xl overflow-hidden flex-shrink-0"
      >
        <ProductImage
          src={item.thumbnail_url}
          alt={item.name}
          fill
          className="object-cover"
          sizes="96px"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          href={`${basePath}/products/${item.slug}`}
          className="text-sm font-medium text-foreground hover:text-link transition-colors duration-200 line-clamp-2"
        >
          {item.name}
        </Link>
        <div className="mt-1 text-sm text-foreground">{item.display_price}</div>
        {item.options_text && (
          <p className="mt-1 text-xs text-muted-foreground">
            {item.options_text}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {t("qty", { quantity })}
        </p>
        <Link
          href={`${basePath}/products/${item.slug}`}
          className="mt-2 inline-block text-sm text-link hover:underline underline-offset-2"
        >
          {t("orderAgain")}
        </Link>
      </div>

      <div className="text-sm font-medium text-foreground">{displayTotal}</div>
    </div>
  );
}
