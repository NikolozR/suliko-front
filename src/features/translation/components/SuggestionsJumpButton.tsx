"use client";
import { useEffect, useState, type RefObject } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

interface SuggestionsJumpButtonProps {
  /** How many suggestions are waiting below. The button hides itself when 0. */
  count: number;
  /** Element wrapping the suggestions panel — scroll target and visibility source. */
  targetRef: RefObject<HTMLElement | null>;
  /**
   * Breakpoint at which the original and translated panes sit side by side — the
   * button then rides the gap between them. `null` when only one pane is on screen
   * (original hidden), where it floats at the bottom centre of the pane instead.
   */
  sideBySideAt: "md" | "lg" | null;
}

/** Zero-width column dropped between the two panes; full width while they are stacked. */
const STRIP_CLASSES = {
  md: "relative flex w-full shrink-0 justify-center py-1 md:w-0 md:self-stretch md:py-0",
  lg: "relative flex w-full shrink-0 justify-center py-1 lg:w-0 lg:self-stretch lg:py-0",
} as const;

/** Lifts the button onto the bottom edge of the gap once the panes are side by side. */
const ANCHOR_CLASSES = {
  md: "md:absolute md:bottom-0 md:left-1/2 md:z-20 md:-translate-x-1/2 md:translate-y-1/2",
  lg: "lg:absolute lg:bottom-0 lg:left-1/2 lg:z-20 lg:-translate-x-1/2 lg:translate-y-1/2",
} as const;

/**
 * Small bouncing arrow that sits between the original document and the translated
 * text, hinting that suggestions were generated further down the page. Disappears
 * once the suggestions panel is actually on screen.
 */
const SuggestionsJumpButton: React.FC<SuggestionsJumpButtonProps> = ({
  count,
  targetRef,
  sideBySideAt,
}) => {
  const t = useTranslations("SuggestionsPanel");
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target || count === 0 || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsPanelVisible(entry.isIntersecting),
      // Require the panel to be a bit into the viewport before hiding the hint,
      // otherwise it flickers away the moment its top edge peeks in.
      { rootMargin: "0px 0px -120px 0px" }
    );
    observer.observe(target);

    return () => observer.disconnect();
  }, [targetRef, count]);

  if (count === 0 || isPanelVisible) return null;

  const label = t("jumpToSuggestions");

  const handleClick = () => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    targetRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    });
  };

  const stripClass = sideBySideAt
    ? STRIP_CLASSES[sideBySideAt]
    : "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex translate-y-1/2 justify-center";
  const anchorClass = sideBySideAt ? ANCHOR_CLASSES[sideBySideAt] : "";

  return (
    <div className={stripClass}>
      <div className={anchorClass}>
        <button
          type="button"
          onClick={handleClick}
          title={label}
          aria-label={label}
          className="animate-jumpDown pointer-events-auto flex cursor-pointer hover:[animation-play-state:paused] items-center gap-1 rounded-full border border-suliko-default-color/40 bg-background py-1.5 pl-2 pr-2.5 text-suliko-default-color shadow-md shadow-black/10 transition-colors hover:bg-suliko-default-color/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-suliko-default-color/50"
        >
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-semibold leading-none tabular-nums">{count}</span>
        </button>
      </div>
    </div>
  );
};

export default SuggestionsJumpButton;
