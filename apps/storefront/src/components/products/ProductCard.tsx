"use client";

import type { Product } from "@spree/sdk";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { memo } from "react";
import { Price } from "@/components/commerce/Price";
import { ProductBadge } from "@/components/commerce/ProductBadge";
import { ProductImage } from "@/components/ui/product-image";
import { trackSelectItem } from "@/lib/analytics/gtm";
import { getStrikethroughPrice, isNewProduct, isOnSale } from "@/lib/commerce";

interface ProductCardProps {
  product: Product;
  basePath?: string;
  categoryId?: string;
  index?: number;
  listId?: string;
  listName?: string;
  fetchPriority?: "high" | "low" | "auto";
  /** Optional currency used for analytics; omit to skip the select_item event. */
  currency?: string;
}

/**
 * Apple Store-style product tile: product photo on a #F5F5F7 rounded block,
 * small colored status label, name, then price.
 */
export const ProductCard = memo(function ProductCard({
  product,
  basePath = "",
  categoryId,
  index,
  listId,
  listName,
  fetchPriority,
  currency,
}: ProductCardProps) {
  const t = useTranslations("products");
  const imageUrl = product.thumbnail_url || null;

  const onSale = isOnSale(product);
  const strikethroughPrice = getStrikethroughPrice(product);
  const isNew = isNewProduct(product);
  const showFromPrefix = (product.variant_count ?? 0) > 1;

  const handleClick = () => {
    if (index != null && listId && listName && currency) {
      trackSelectItem(product, listId, listName, index, currency);
    }
  };

  return (
    <Link
      href={`${basePath}/products/${product.slug}${categoryId ? `?category_id=${categoryId}` : ""}`}
      className="group block"
      onClick={handleClick}
    >
      {/* Image tile */}
      <div className="relative aspect-square overflow-hidden rounded-[18px] bg-card">
        <ProductImage
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 70vw, (max-width: 1024px) 45vw, 300px"
          iconClassName="w-16 h-16"
          fetchPriority={fetchPriority}
        />
      </div>

      {/* Content */}
      <div className="px-1 pt-4 pb-2">
        {onSale ? (
          <ProductBadge variant="sale">{t("sale")}</ProductBadge>
        ) : isNew ? (
          <ProductBadge variant="new">{t("new")}</ProductBadge>
        ) : null}

        <h3 className="mt-0.5 text-base font-semibold tracking-tight text-foreground line-clamp-2 group-hover:text-link transition-colors">
          {product.name}
        </h3>

        <Price
          amount={product.price?.display_amount}
          compareAt={strikethroughPrice}
          prefix={showFromPrefix ? t("fromPrice") : undefined}
          size="sm"
          className="mt-1.5 text-muted-foreground [&>span:first-child]:text-foreground"
        />

        {!product.purchasable && (
          <p className="mt-1 text-sm text-muted-foreground">
            {t("outOfStock")}
          </p>
        )}
      </div>
    </Link>
  );
});
