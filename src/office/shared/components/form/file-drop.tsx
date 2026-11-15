"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Upload } from "lucide-react";
import { useEffect, useState, type DragEvent } from "react";

import { cn } from "@office/shared/lib/utils";

/**
 * Choose files, or drop them here. Any number at once.
 *
 * The whole zone is the label of a real file input, so a click anywhere on it
 * opens the picker, and the input (hidden from the eye, not from the keyboard
 * or a screen reader) keeps its focus ring on the zone. The words are the
 * app's own: the browser's "Choose File / No file chosen" comes in the
 * browser's language (audit F30).
 *
 * It holds nothing. What was picked is handed to `onFiles` and shown by the
 * caller, which is what lets one zone take a second batch.
 */
export function FileDrop({
  id,
  title,
  hint,
  onFiles,
  size = "md",
  multiple = true,
  disabled = false,
  className,
}: {
  id: string;
  title: string;
  hint?: string;
  onFiles: (files: File[]) => void;
  /**
   * `lg` for the one a page leads with, `md` for one inside a card, `sm` for
   * a button-sized one next to a page's `lg` zone (one dashed zone a page).
   */
  size?: "sm" | "md" | "lg";
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const [over, setOver] = useState(false);

  const carriesFiles = (event: DragEvent) => event.dataTransfer.types.includes("Files");

  return (
    <label
      htmlFor={id}
      onDragOver={(event) => {
        if (disabled || !carriesFiles(event)) return;
        event.preventDefault();
        // Its own drop, not the card's it may sit in.
        event.stopPropagation();
        event.dataTransfer.dropEffect = "copy";
        setOver(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={(event) => {
        if (disabled || !carriesFiles(event)) return;
        event.preventDefault();
        event.stopPropagation();
        setOver(false);
        const dropped = Array.from(event.dataTransfer.files);
        if (dropped.length) onFiles(multiple ? dropped : dropped.slice(0, 1));
      }}
      className={cn(
        "text-muted-foreground flex cursor-pointer items-center justify-center gap-3 rounded-md border text-sm transition-[background-color,border-color,box-shadow,scale] duration-200",
        "hover:border-suliko-default-color/60 hover:bg-hue-blue-tint/40 hover:shadow-sm",
        "has-[:focus-visible]:border-ring has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-[3px]",
        // The one a page leads with is tinted at rest: it is where to start.
        size === "lg" && "border-hue-blue-ink/40 bg-hue-blue-tint/30 min-h-20 border-dashed px-4 py-4",
        size === "md" && "border-input min-h-12 border-dashed px-3 py-2.5",
        // Looks like an outline button; a file dropped on it still lands.
        size === "sm" && "border-input bg-card min-h-8 w-fit gap-2 px-3 py-1.5 shadow-xs",
        // A file held over it: the zone lifts and its mark bounces.
        over &&
          "border-suliko-default-color bg-hue-blue-tint text-foreground ring-suliko-default-color/15 scale-[1.01] shadow-md ring-4",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      <input
        id={id}
        type="file"
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const picked = Array.from(event.target.files ?? []);
          // Emptied, so choosing the same file again is still a change.
          event.target.value = "";
          if (picked.length) onFiles(picked);
        }}
      />
      {size === "lg" ? (
        <span
          aria-hidden
          className="bg-hue-blue-tint text-hue-blue-ink flex size-10 shrink-0 items-center justify-center rounded-full"
        >
          <Upload className={cn("size-5", over && "animate-bounce")} />
        </span>
      ) : (
        <Upload
          className={cn("text-hue-blue-ink size-4 shrink-0", over && "animate-bounce")}
          aria-hidden
        />
      )}
      <span className="min-w-0">
        <span className={cn("text-foreground block", size !== "md" && "font-medium")}>{title}</span>
        {hint && <span className="block text-xs">{hint}</span>}
      </span>
    </label>
  );
}

/**
 * While mounted, a file dropped anywhere outside a drop zone does nothing.
 *
 * Without it the browser takes the file itself: it opens the PDF in the tab,
 * in place of a half-filled form. Zones handle their own drops first (they
 * call `preventDefault`), so this only sees the ones that missed.
 */
export function useStrayDropGuard() {
  useEffect(() => {
    const guard = (event: globalThis.DragEvent) => {
      if (event.defaultPrevented || !event.dataTransfer?.types.includes("Files")) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "none";
    };
    window.addEventListener("dragover", guard);
    window.addEventListener("drop", guard);
    return () => {
      window.removeEventListener("dragover", guard);
      window.removeEventListener("drop", guard);
    };
  }, []);
}
