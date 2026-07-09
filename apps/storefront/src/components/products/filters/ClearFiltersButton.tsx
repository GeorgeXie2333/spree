"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { buildListingSearchParams } from "@/lib/utils/listing-search-params";

/**
 * Pill button that clears all listing filters from the URL while
 * preserving the search query and sort order. Used by the PLP empty
 * state so users can recover from an over-filtered result set.
 */
export function ClearFiltersButton({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const next = buildListingSearchParams(
      new URLSearchParams(searchParams.toString()),
      {
        query: searchParams.get("q") ?? undefined,
        filters: {
          optionValues: [],
          sortBy: searchParams.get("sort") ?? undefined,
        },
      },
    );
    const query = next.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  };

  return (
    <Button onClick={handleClick} disabled={isPending}>
      {children}
    </Button>
  );
}
