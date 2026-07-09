"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterDropdownProps {
  label: React.ReactNode;
  badgeCount?: number;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
  align?: "left" | "right";
}

export function FilterDropdown({
  label,
  badgeCount,
  isOpen,
  onToggle,
  onClose,
  children,
  align = "left",
}: FilterDropdownProps) {
  const hasActive = badgeCount !== undefined && badgeCount > 0;

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => {
        if (open) onToggle();
        else onClose();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          size="sm"
        >
          <span>{label}</span>
          {hasActive && (
            <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
              {badgeCount}
            </span>
          )}
          <ChevronDown
            className={`size-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align === "right" ? "end" : "start"}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
