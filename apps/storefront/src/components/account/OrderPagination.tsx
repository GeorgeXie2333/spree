import Link from "next/link";

interface OrderPaginationProps {
  basePath: string;
  currentPage: number;
  totalPages: number;
  previousPage: number | null;
  nextPage: number | null;
  labels: {
    pagination: string;
    previousPage: string;
    nextPage: string;
    pageNumber: string;
  };
}

function visiblePages(currentPage: number, totalPages: number) {
  const pages = new Set([1, totalPages]);

  for (let page = currentPage - 2; page <= currentPage + 2; page++) {
    if (page >= 1 && page <= totalPages) pages.add(page);
  }

  return [...pages].sort((a, b) => a - b);
}

function pageHref(basePath: string, page: number) {
  return `${basePath}/account/orders?page=${page}`;
}

export function OrderPagination({
  basePath,
  currentPage,
  totalPages,
  previousPage,
  nextPage,
  labels,
}: OrderPaginationProps) {
  const pages = visiblePages(currentPage, totalPages);
  const pageLabel = (page: number) =>
    labels.pageNumber.replace("{page}", String(page));

  return (
    <nav
      aria-label={labels.pagination}
      className="mt-6 flex items-center justify-center gap-2"
    >
      {previousPage ? (
        <Link
          href={pageHref(basePath, previousPage)}
          aria-label={labels.previousPage}
          className="rounded-full px-3 py-2 text-sm text-link hover:bg-muted hover:underline"
        >
          {labels.previousPage}
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="rounded-full px-3 py-2 text-sm text-muted-foreground"
        >
          {labels.previousPage}
        </span>
      )}

      <ol className="flex items-center gap-1">
        {pages.map((page, index) => {
          const previousVisiblePage = pages[index - 1];
          const hasGap = previousVisiblePage && page - previousVisiblePage > 1;

          return (
            <li key={page} className="flex items-center gap-1">
              {hasGap && (
                <span aria-hidden="true" className="px-1 text-muted-foreground">
                  …
                </span>
              )}
              {page === currentPage ? (
                <span
                  aria-current="page"
                  className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
                >
                  {page}
                </span>
              ) : (
                <Link
                  href={pageHref(basePath, page)}
                  aria-label={pageLabel(page)}
                  className="inline-flex size-9 items-center justify-center rounded-full text-sm text-foreground hover:bg-muted hover:text-foreground"
                >
                  {page}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {nextPage ? (
        <Link
          href={pageHref(basePath, nextPage)}
          aria-label={labels.nextPage}
          className="rounded-full px-3 py-2 text-sm text-link hover:bg-muted hover:underline"
        >
          {labels.nextPage}
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="rounded-full px-3 py-2 text-sm text-muted-foreground"
        >
          {labels.nextPage}
        </span>
      )}
    </nav>
  );
}
