import { cn } from "@/lib/utils";

type BadgeVariant = "new" | "sale" | "preorder" | "outOfStock";

interface ProductBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

// Apple-style: small colored text labels rather than pill overlays.
const variantClasses: Record<BadgeVariant, string> = {
  new: "text-[#b64400]",
  sale: "text-[#e30000]",
  preorder: "text-link",
  outOfStock: "text-muted-foreground",
};

export function ProductBadge({
  variant,
  children,
  className,
}: ProductBadgeProps) {
  return (
    <span
      className={cn(
        "text-xs font-semibold",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
