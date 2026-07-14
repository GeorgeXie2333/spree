/**
 * Skeleton matching the PLP toolbar row (results count on the left,
 * sort trigger on the right). Rendered by FilterBar's own loading
 * state and by the PLP Suspense fallback.
 */
export function FilterBarSkeleton() {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-3">
      <Skeleton className="h-5 w-24 rounded-full" />
      <Skeleton className="h-9 w-32 rounded-full" />
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
