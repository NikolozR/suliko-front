"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type MetalFxComponent = typeof import("metal-fx").MetalFx;

interface MetalCtaProps {
  /** One button or link. It renders as is until the effect has loaded. */
  children: ReactNode;
  /** Chromatic is the Suliko-blue iridescent one; silver stays neutral. */
  preset?: "chromatic" | "silver" | "gold";
  /** Classes for the wrapper, e.g. `w-full sm:w-auto` to keep a full-width button. */
  className?: string;
  strength?: number;
  /** Corner radius of the wrapped button in px (rounded-md is 8, rounded-xl is 12). */
  radius?: number;
}

/** Gutter between the button and the outside of the metal frame, and the frame's width (px). */
const RING_GAP = 3;
const RING_WIDTH = 2;

/**
 * Liquid-metal ring around the ONE main button of a dark landing section.
 *
 * The button is in the server-rendered HTML and works without the effect.
 * `metal-fx` (about 42 KB gzipped) is fetched once the browser is idle, so it
 * never competes with the hero for LCP; without WebGL2 it renders the plain
 * button. Every instance shares one WebGL context and pauses off screen.
 *
 * The theme is pinned to dark: these sections are always dark navy, whatever
 * the visitor's OS theme is. Reduced motion keeps a still frame of the metal.
 */
export default function MetalCta({
  children,
  preset = "silver",
  className,
  strength = 0.9,
  radius = 8,
}: MetalCtaProps) {
  const [Metal, setMetal] = useState<MetalFxComponent | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      import("metal-fx")
        .then((m) => {
          if (!cancelled) setMetal(() => m.MetalFx);
        })
        // Offline, blocked or a stale chunk: the plain button is already fine.
        .catch(() => {});
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(load, { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const id = window.setTimeout(load, 800);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  // Same box as the effect's own wrapper (inline-flex, same gutter), so nothing
  // shifts when it swaps in.
  if (!Metal) {
    return (
      <div className={cn("inline-flex", className)} style={{ padding: RING_GAP }}>
        {children}
      </div>
    );
  }

  return (
    <Metal
      variant="button"
      preset={preset}
      theme="dark"
      strength={strength}
      paused={reducedMotion}
      // Keep the button's own white fill and its focus ring (a box-shadow):
      // the default flattens both, leaving a dark button with no keyboard focus.
      normalizeHostStyles={false}
      // The effect paints under the button, so a button with a solid fill would
      // hide it. A small gutter lets the metal frame it instead.
      style={{ padding: RING_GAP }}
      borderRadius={radius + RING_GAP}
      ringCssPx={RING_WIDTH}
      // The effect hides its whole host (opacity 0, visibility hidden) until its
      // first GL frame. The button has its own fill, so never let it vanish: the
      // ring simply appears when it is ready, and a stuck GL frame costs nothing.
      className={cn("lp-metal-keep", className)}
    >
      {children}
    </Metal>
  );
}
