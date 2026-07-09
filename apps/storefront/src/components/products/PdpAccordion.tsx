import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PdpAccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Apple-style hairline accordion section for the PDP buy box, built on the
 * native <details> element so it works without client-side JS.
 */
export function PdpAccordion({
  title,
  children,
  defaultOpen = false,
  className,
}: PdpAccordionProps) {
  return (
    <details
      open={defaultOpen}
      className={cn("group border-b border-border", className)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium text-foreground transition-colors duration-200 hover:text-link [&::-webkit-details-marker]:hidden">
        {title}
        <Plus
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45"
        />
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  );
}
