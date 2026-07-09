import { cn } from "@/lib/utils";

export interface TrustItem {
  icon: React.ReactNode;
  title: string;
  text?: string;
}

interface TrustStripProps {
  items: TrustItem[];
  className?: string;
}

/** Row of icon + copy trust signals (free shipping, returns, warranty…). */
export function TrustStrip({ items, className }: TrustStripProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4",
        items.length === 3 && "lg:grid-cols-3",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.title}
          className="flex flex-col items-center gap-2 text-center"
        >
          <div className="text-foreground [&_svg]:size-8 [&_svg]:stroke-[1.5]">
            {item.icon}
          </div>
          <p className="text-sm font-semibold text-foreground">{item.title}</p>
          {item.text && (
            <p className="max-w-52 text-xs text-muted-foreground">
              {item.text}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
