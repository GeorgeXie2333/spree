import type * as React from "react";

/**
 * Skeleton placeholder for a single product card. Matches the
 * Apple-style `<ProductCard>` shape: gray rounded-[18px] image tile
 * with text placeholder lines below.
 */
export function ProductCardSkeleton(): React.JSX.Element {
  return (
    <div className="animate-pulse">
      <div className="aspect-square rounded-[18px] bg-card" />
      <div className="px-1 pt-4 pb-2">
        <div className="h-4 w-3/4 rounded-full bg-card" />
        <div className="mt-2.5 h-4 w-1/3 rounded-full bg-card" />
      </div>
    </div>
  );
}
