"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { cn } from "@office/shared/lib/utils";

/**
 * A single pressed/unpressed button standing in for a radio choice or a
 * boolean — urgency, handover method, copy type, "is this notarised". Used
 * wherever a native `<select>` or checkbox would work but the options are
 * few enough (and consequential enough — notarising a document wrong is
 * expensive to fix after the fact) that seeing every choice at a glance beats
 * opening a dropdown.
 */
export function ToggleChip({
  pressed,
  onClick,
  children,
  className,
  title,
  disabled,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-md border text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        pressed
          ? "bg-suliko-default-color border-suliko-default-color text-white"
          : "border-input hover:bg-accent",
        className,
      )}
    >
      {children}
    </button>
  );
}
