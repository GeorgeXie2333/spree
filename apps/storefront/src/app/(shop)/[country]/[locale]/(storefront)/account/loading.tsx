export default function AccountLoading() {
  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <aside className="hidden w-52 flex-shrink-0 lg:block">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-24 rounded bg-card" />
            <div className="h-3 w-36 rounded bg-card" />
            <div className="mt-6 space-y-2">
              <div className="h-4 w-20 rounded bg-card" />
              <div className="h-4 w-16 rounded bg-card" />
              <div className="h-4 w-24 rounded bg-card" />
              <div className="h-4 w-20 rounded bg-card" />
            </div>
          </div>
        </aside>
        <div className="min-w-0 flex-1 animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded-xl bg-card" />
          <div className="h-4 w-2/3 rounded-xl bg-card" />
          <div className="h-32 rounded-[18px] bg-card" />
          <div className="h-32 rounded-[18px] bg-card" />
        </div>
      </div>
    </div>
  );
}
