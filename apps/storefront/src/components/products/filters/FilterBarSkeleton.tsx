/**
 * Skeleton matching the PLP toolbar row (results count on the left,
 * sort trigger on the right). Rendered by FilterBar's own loading
 * state and by the PLP Suspense fallback.
 */
export function FilterBarSkeleton() {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-3">
      <div className="h-5 w-24 animate-pulse rounded-full bg-card" />
      <div className="h-9 w-32 animate-pulse rounded-full bg-card" />
    </div>
  );
}
