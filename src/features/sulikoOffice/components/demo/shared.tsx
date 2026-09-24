"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useTranslations } from "next-intl";

/**
 * Shared machinery for the four autoplaying product demos on /tms.
 *
 * Every demo is drawn with invented figures. Deliberately not screen
 * recordings: the real dashboard shows our own bureau's revenue, profit and
 * receivables, which must never appear on a public page. Each frame is exposed
 * to assistive tech as one labelled image so screen readers don't read the
 * sample numbers out as facts.
 */

export type T = ReturnType<typeof useTranslations<"SulikoOffice">>;

export const FIRST_NEW_ID = 1043;

/**
 * Steps through `steps` on a loop.
 *
 * Runs only while the frame is on screen, the tab is visible and the pointer is
 * not resting on it. Under prefers-reduced-motion it never starts, and holds
 * `staticIndex`: the step that best explains the demo on its own.
 */
export function useDemoLoop(steps: readonly { ms: number }[], staticIndex: number) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [loop, setLoop] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      setStep(staticIndex);
    }
  }, [staticIndex]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.3 });
    io.observe(frame);
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const running = !reduced && onScreen && pageVisible && !hovered;
  const ms = steps[step].ms;

  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => {
      if (step + 1 >= steps.length) {
        setLoop((l) => l + 1);
        setStep(0);
      } else {
        setStep(step + 1);
      }
    }, ms);
    return () => window.clearTimeout(id);
  }, [running, step, ms, steps.length]);

  return {
    frameRef,
    step,
    loop,
    hoverProps: { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) },
  };
}

/** The window every demo is drawn in, with the soft halo behind it. */
export function DemoFrame({
  frameRef,
  hoverProps,
  label,
  title,
  headerExtra,
  sidebar,
  panelClassName = "",
  children,
  overlay,
}: {
  frameRef: RefObject<HTMLDivElement | null>;
  hoverProps: { onMouseEnter: () => void; onMouseLeave: () => void };
  label: string;
  title: ReactNode;
  headerExtra?: ReactNode;
  sidebar?: ReactNode;
  panelClassName?: string;
  children: ReactNode;
  /** Absolutely positioned on top of the frame, e.g. the fake cursor. */
  overlay?: ReactNode;
}) {
  return (
    <div className="relative">
      <div aria-hidden className="absolute -inset-4 rounded-[28px] bg-[#f4f6fd] sm:-inset-7 dark:bg-white/[0.04]" />
      <div
        ref={frameRef}
        role="img"
        aria-label={label}
        {...hoverProps}
        className="relative flex overflow-hidden rounded-[18px] border border-border bg-background shadow-[0_30px_60px_-30px_rgba(17,40,156,0.28)]"
      >
        {sidebar}
        <div aria-hidden className={`relative flex min-w-0 grow flex-col gap-3.5 p-4 sm:px-[22px] sm:pt-5 sm:pb-[22px] ${panelClassName}`}>
          <div className="flex h-8 items-center justify-between gap-2">
            <span className="text-[17px] text-foreground">{title}</span>
            {headerExtra ?? <span className="text-xs text-muted-foreground">Suliko Office</span>}
          </div>
          {children}
        </div>
        {overlay}
      </div>
    </div>
  );
}

/**
 * Aims a fake cursor at `targets[target]` once the step has rendered it.
 * With no target it rests near the bottom right, or hides if `rest` is false.
 */
export function useDemoCursor<K extends string>(
  frameRef: RefObject<HTMLDivElement | null>,
  targets: RefObject<Partial<Record<K, HTMLElement | null>>>,
  target: K | undefined,
  step: number,
  rest = true
) {
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false });
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const ro = new ResizeObserver(() => setWidth(frame.offsetWidth));
    ro.observe(frame);
    return () => ro.disconnect();
  }, [frameRef]);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const f = frame.getBoundingClientRect();
    const r = target ? targets.current[target]?.getBoundingClientRect() : undefined;

    if (r && r.width > 0) {
      setCursor({ x: r.left - f.left + r.width * 0.55, y: r.top - f.top + r.height * 0.6, visible: true });
    } else if (rest) {
      setCursor({ x: f.width * 0.72, y: f.height * 0.88, visible: true });
    } else {
      setCursor((c) => ({ ...c, visible: false }));
    }
  }, [frameRef, targets, target, step, width, rest]);

  return cursor;
}

export function FakeCursor({ x, y, visible, clicking }: { x: number; y: number; visible: boolean; clicking: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 z-10 transition-[transform,opacity] duration-700 ease-in-out motion-reduce:transition-none"
      style={{ transform: `translate(${x}px, ${y}px)`, opacity: visible ? 1 : 0 }}
    >
      {clicking && (
        <span className="absolute -top-3 -left-3 h-6 w-6 animate-ping rounded-full bg-suliko-default-color/40 motion-reduce:animate-none" />
      )}
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        className={`drop-shadow-md transition-transform duration-150 ${clicking ? "scale-90" : ""}`}
      >
        <path d="M4 2.5 19.5 12l-7 1.6L9 20.5z" fill="#111a3a" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** A small confirmation pill along the bottom of a frame. */
export function DemoToast({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-x-4 bottom-4 flex justify-center sm:inset-x-[22px] sm:bottom-[22px]">
      <div className="flex items-center gap-2 rounded-full bg-[#111a3a] px-4 py-2.5 text-[13px] text-white shadow-lg office-enter dark:bg-white dark:text-[#111a3a]">
        {children}
      </div>
    </div>
  );
}

export function OrderLine({ id, doc, pair }: { id: string; doc: string; pair: string }) {
  return (
    <div className="grid grid-cols-[50px_minmax(0,1fr)_auto] items-center gap-2 text-xs text-[#3a4466] dark:text-slate-300">
      <span className="text-[#7a8299] dark:text-slate-400">{id}</span>
      <span className="truncate text-foreground">{doc}</span>
      <span>{pair}</span>
    </div>
  );
}
