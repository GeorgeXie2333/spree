"use client";

import type { Product } from "@spree/sdk";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";

interface ProductRailProps {
  products: Product[];
  basePath: string;
  listId?: string;
  listName?: string;
  currency?: string;
}

/** Horizontal scroll-snap product rail with paddle buttons, Apple Store style. */
export function ProductRail({
  products,
  basePath,
  listId,
  listName,
  currency,
}: ProductRailProps) {
  const t = useTranslations("products");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updatePaddles = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  const scrollBy = (direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <div className="group/rail relative">
      <div
        ref={scrollRef}
        onScroll={updatePaddles}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 md:gap-5"
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            className="w-[70vw] max-w-72 shrink-0 snap-start sm:w-64"
          >
            <ProductCard
              product={product}
              basePath={basePath}
              index={index}
              listId={listId}
              listName={listName}
              currency={currency}
            />
          </div>
        ))}
      </div>

      {canScrollLeft && (
        <Button
          variant="secondary"
          size="icon-lg"
          onClick={() => scrollBy(-1)}
          aria-label={t("carouselPrev")}
          className="absolute top-1/3 left-1 hidden -translate-y-1/2 bg-white/90 shadow-md backdrop-blur transition-opacity md:inline-flex"
        >
          <ChevronLeft className="size-5" />
        </Button>
      )}
      {canScrollRight && (
        <Button
          variant="secondary"
          size="icon-lg"
          onClick={() => scrollBy(1)}
          aria-label={t("carouselNext")}
          className="absolute top-1/3 right-1 hidden -translate-y-1/2 bg-white/90 shadow-md backdrop-blur transition-opacity md:inline-flex"
        >
          <ChevronRight className="size-5" />
        </Button>
      )}
    </div>
  );
}
