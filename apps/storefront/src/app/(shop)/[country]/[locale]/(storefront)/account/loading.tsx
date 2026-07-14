import { Skeleton } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <aside className="hidden w-52 flex-shrink-0 lg:block">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-36" />
            <div className="mt-6 flex flex-col gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Skeleton className="h-8 w-1/3 rounded-xl" />
          <Skeleton className="h-4 w-2/3 rounded-xl" />
          <Skeleton className="h-32 rounded-[18px]" />
          <Skeleton className="h-32 rounded-[18px]" />
        </div>
      </div>
    </div>
  );
}
