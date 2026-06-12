"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface CardMenuItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  destructive?: boolean;
}

interface CardMenuProps {
  items: CardMenuItem[];
}

export function CardMenu({ items }: CardMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-20 min-w-[180px] rounded-md border bg-popover text-popover-foreground shadow-md py-1"
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  item.onClick();
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors",
                  item.destructive && "text-destructive hover:text-destructive"
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
