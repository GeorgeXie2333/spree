import Link from "next/link";
import { cn } from "@/lib/utils";

interface PromoTileProps {
  title: string;
  text?: string;
  ctaLabel: string;
  href: string;
  /** "light" = #F5F5F7 card, "dark" = near-black card. */
  tone?: "light" | "dark";
  /** Optional decorative image element rendered below the copy. */
  children?: React.ReactNode;
  className?: string;
}

/** Large rounded promo card in the style of Apple Store featured tiles. */
export function PromoTile({
  title,
  text,
  ctaLabel,
  href,
  tone = "light",
  children,
  className,
}: PromoTileProps) {
  const dark = tone === "dark";

  return (
    <div
      className={cn(
        "relative flex min-h-44 flex-col overflow-hidden rounded-[18px] p-6 md:p-8",
        dark
          ? "bg-promo-dark text-primary-foreground"
          : "bg-card text-foreground",
        className,
      )}
    >
      <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
        {title}
      </h3>
      {text && (
        <p
          className={cn(
            "mt-2 max-w-none text-sm md:text-base",
            dark ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {text}
        </p>
      )}
      <div className="mt-4">
        <Link
          href={href}
          className={cn(
            "text-sm font-medium hover:underline md:text-base",
            dark ? "text-promo-link" : "text-link",
          )}
        >
          {ctaLabel}
          <span aria-hidden="true"> ›</span>
        </Link>
      </div>
      {children && <div className="mt-6 flex-1">{children}</div>}
    </div>
  );
}
