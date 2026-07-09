import Link from "next/link";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  /** Bold lead-in, e.g. "New arrivals." */
  title: string;
  /** Muted continuation, e.g. "See what just landed." */
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}

/** Apple-style two-tone section heading with an optional "view all ›" link. */
export function SectionHeader({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1",
        className,
      )}
    >
      <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">
        {title}
        {subtitle && (
          <span className="font-semibold text-muted-foreground">
            {" "}
            {subtitle}
          </span>
        )}
      </h2>
      {viewAllHref && viewAllLabel && (
        <Link
          href={viewAllHref}
          className="shrink-0 text-sm text-link hover:underline"
        >
          {viewAllLabel}
          <span aria-hidden="true"> ›</span>
        </Link>
      )}
    </div>
  );
}
