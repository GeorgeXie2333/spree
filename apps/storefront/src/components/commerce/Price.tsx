import { cn } from "@/lib/utils";

interface PriceProps {
  /** Formatted current price, e.g. "$129.00". */
  amount?: string | null;
  /** Formatted reference price shown crossed out when on sale. */
  compareAt?: string | null;
  /** Prefix such as "From" for multi-variant products. */
  prefix?: string;
  size?: "sm" | "base" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-2xl",
} as const;

export function Price({
  amount,
  compareAt,
  prefix,
  size = "base",
  className,
}: PriceProps) {
  if (!amount) return null;

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-2 text-foreground",
        sizeClasses[size],
        className,
      )}
    >
      <span>
        {prefix ? `${prefix} ` : ""}
        {amount}
      </span>
      {compareAt && (
        <span className="text-muted-foreground line-through text-[0.85em]">
          {compareAt}
        </span>
      )}
    </span>
  );
}
