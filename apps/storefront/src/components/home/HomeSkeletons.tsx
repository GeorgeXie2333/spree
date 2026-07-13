const RAIL_ITEMS = ["a", "b", "c", "d", "e"];

/** Suspense fallback matching the layout of a HomeProductRail. */
export function HomeProductRailSkeleton() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 h-8 w-72 max-w-full animate-pulse rounded-md bg-card" />
      <div className="flex gap-4 overflow-hidden md:gap-5">
        {RAIL_ITEMS.map((key) => (
          <div
            key={key}
            className="w-[70vw] max-w-72 shrink-0 animate-pulse sm:w-64"
          >
            <div className="aspect-square rounded-[18px] bg-card" />
            <div className="mt-3 h-4 w-3/4 rounded bg-card" />
            <div className="mt-2 h-4 w-1/4 rounded bg-card" />
          </div>
        ))}
      </div>
    </section>
  );
}
