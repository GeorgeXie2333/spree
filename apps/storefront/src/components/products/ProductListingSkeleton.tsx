import { FilterBarSkeleton } from "@/components/products/filters";
import { ProductGridSkeleton } from "@/components/products/ProductGridSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Full PLP skeleton mirroring the layout rendered by ProductListing:
 * a left filter sidebar (desktop only) next to a toolbar strip and
 * the product grid. Used as the Suspense fallback so route navigation
 * shows a placeholder with the same shape as the final UI.
 */
export function ProductListingSkeleton() {
  return (
    <div className="lg:flex lg:items-start lg:gap-10 xl:gap-12">
      <aside className="hidden w-60 shrink-0 lg:block xl:w-64">
        {[...Array(3)].map((_, groupIndex) => (
          <div
            key={groupIndex}
            className="border-b border-border/60 pb-5 pt-5 first:pt-0"
          >
            <Skeleton className="h-4 w-20 rounded-full" />
            <div className="mt-4 flex flex-col gap-3">
              {[...Array(4)].map((_, rowIndex) => (
                <Skeleton key={rowIndex} className="h-4 w-full rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </aside>

      <div className="min-w-0 flex-1">
        <FilterBarSkeleton />
        <div className="pt-6">
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}
