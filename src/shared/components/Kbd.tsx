"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/utils";

/**
 * Ctrl on Windows and Linux, the command sign on a Mac. Unknown until the
 * browser has hydrated, so it starts as Ctrl and corrects itself in an effect
 * instead of mismatching the server render.
 */
export function useModLabel(): string {
  const [label, setLabel] = useState("Ctrl");
  useEffect(() => {
    if (/Mac|iPhone|iPad/i.test(navigator.platform)) setLabel("⌘");
  }, []);
  return label;
}

const KEY_LABELS: Record<string, string> = {
  Enter: "↵",
  ArrowUp: "↑",
  ArrowDown: "↓",
};

/**
 * One key cap. Takes its colour from the text around it, so the same badge
 * reads on the sidebar, on the brand-coloured active item and in a dialog.
 * "mod" is Ctrl, or the command sign on a Mac.
 */
export function Kbd({ children, className }: { children: string; className?: string }) {
  const mod = useModLabel();
  const label = children === "mod" ? mod : (KEY_LABELS[children] ?? children);
  return (
    <kbd
      className={cn(
        "inline-flex h-4 min-w-4 items-center justify-center rounded border border-current/30 px-1",
        "font-sans text-[10px] leading-none font-medium opacity-70",
        className,
      )}
    >
      {label}
    </kbd>
  );
}

/** Several key caps in a row, e.g. Alt then 1, or Ctrl then Enter. */
export function KbdCombo({ keys, className }: { keys: readonly string[]; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {keys.map((key, index) => (
        <Kbd key={`${key}-${index}`}>{key}</Kbd>
      ))}
    </span>
  );
}

/** Plain-text form of a combo, for `title` attributes. */
export function useComboText(keys: readonly string[]): string {
  const mod = useModLabel();
  return keys.map((key) => (key === "mod" ? mod : (KEY_LABELS[key] ?? key))).join(" + ");
}
