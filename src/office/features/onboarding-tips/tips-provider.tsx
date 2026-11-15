"use client";
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import { Joyride, EVENTS, type EventData, type Step } from "react-joyride";
import { useTranslations } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { saveTipsAction } from "@office/features/onboarding-tips/actions";
import { TIPS, tipSelector, type TipId } from "@office/features/onboarding-tips/tips";
import { HotspotCard, TourCard } from "@office/features/onboarding-tips/tips-ui";
import { usePathname, useRouter } from "@office/i18n/navigation";

/** What the session says about tips (`SessionInfo.tips`). */
export interface TipsInitial {
  enabled: boolean;
  seen: string[];
}

interface TipsContextValue {
  enabled: boolean;
  /** Tips still to see (on any page). */
  unseen: number;
  /** At least one tip was dismissed, so "replay tips" has something to do. */
  anySeen: boolean;
  /** How many tips are dismissed, for the "2 of 8" counter. */
  seenCount: number;
  /** How many tips this account can ever see (its plan and permissions decide). */
  total: number;
  tourRunning: boolean;
  startTour: () => void;
  replay: () => void;
}

const TipsContext = createContext<TipsContextValue>({
  enabled: false,
  unseen: 0,
  anySeen: false,
  seenCount: 0,
  total: 0,
  tourRunning: false,
  startTour: () => {},
  replay: () => {},
});

export const useTips = () => useContext(TipsContext);

/**
 * The colours Joyride draws with. CSS variables, so the dark theme follows
 * by itself: the brand blue (fixed: white text on it passes in both themes) for the beacon and the primary button,
 * the popover surface for the tip.
 */
const OPTIONS = {
  primaryColor: "#3b59f3",
  arrowColor: "var(--popover)",
  overlayColor: "rgb(0 0 0 / 0.5)",
  zIndex: 60,
  width: 300,
  spotlightRadius: 8,
  // Hug the element: the default 10px reads as a box beside a sidebar item.
  spotlightPadding: 3,
  // Small enough to sit on a sidebar item without crowding its label.
  beaconSize: 14,
} as const;



/** Waits for `selector` to exist, up to five seconds; resolves either way. */
function waitForElement(selector: string): Promise<void> {
  return new Promise((resolve) => {
    const started = Date.now();
    const look = () => {
      if (document.querySelector(selector) || Date.now() - started > 5000) resolve();
      else window.setTimeout(look, 100);
    };
    look();
  });
}

/** On screen: laid out, and not the sidebar parked off-canvas on a phone. */
function visible(selector: string): boolean {
  const element = document.querySelector(selector);
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < window.innerWidth;
}

/**
 * First-run tips for a new account: a pulsing hotspot on each feature worth
 * knowing, and an optional tour through the same tips in order.
 *
 * Which tips exist and what they say is `tips.ts` plus the `tips` messages;
 * the elements carry `data-tip`. Seen-state belongs to the API (per account,
 * in the session payload) and is kept here in state, so a dismissal shows at
 * once and a failed save costs nothing but the tip showing again.
 */
export function TipsProvider({
  initial,
  children,
}: {
  initial: TipsInitial | null;
  children: ReactNode;
}) {
  const enabled = initial?.enabled ?? false;
  const t = useTranslations("tips");
  const router = useRouter();
  const pathname = usePathname();

  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set(initial?.seen ?? []));
  const [present, setPresent] = useState<readonly TipId[]>([]);
  const [available, setAvailable] = useState<readonly TipId[]>([]);
  const [openId, setOpenId] = useState<TipId | null>(null);
  const [tourSteps, setTourSteps] = useState<Step[] | null>(null);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const persist = useCallback((ids: readonly string[]) => {
    setSeen((previous) => new Set([...previous, ...ids]));
    void saveTipsAction({ seen: [...ids] });
  }, []);

  // Which tips have an element on screen right now. Scanned again when the
  // page changes and when the DOM does (a page streams in, a dialog opens).
  useEffect(() => {
    if (!enabled) return;
    let timer: number | undefined;
    const scan = () => {
      const found = TIPS.filter((tip) => visible(tipSelector(tip.id))).map((tip) => tip.id);
      // The tips this account can ever see: a sidebar tip needs its entry, a page
      // tip needs the entry of its screen. Used for "2 of 6", so the total is
      // not a number of tips someone's plan can never show.
      const reachable = TIPS.filter((tip) =>
        document.querySelector(tipSelector(tip.needs ?? tip.id)),
      ).map((tip) => tip.id);
      setAvailable((previous) =>
        previous.length === reachable.length && previous.every((id, index) => id === reachable[index])
          ? previous
          : reachable,
      );
      setPresent((previous) =>
        previous.length === found.length && previous.every((id, index) => id === found[index])
          ? previous
          : found,
      );
    };
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(scan, 250);
    };
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [enabled, pathname]);

  const tourRunning = tourSteps !== null;

  // The spotlight is measured once and then only on scroll, on a window resize
  // or when the element itself changes size. A page that is still settling after
  // the tour opened it (streamed content, a banner arriving) moves the element
  // without any of those, and the spotlight stayed where it was. A resize event
  // every few hundred milliseconds makes it measure again; it only re-renders
  // when the position actually changed.
  useEffect(() => {
    if (!tourRunning) return;
    const timer = window.setInterval(() => window.dispatchEvent(new Event("resize")), 400);
    return () => window.clearInterval(timer);
  }, [tourRunning]);

  const startTour = useCallback(() => {
    const exists = (id: string) => !!document.querySelector(tipSelector(id));
    const steps: Step[] = [];
    for (const tip of TIPS) {
      if (tip.tourPath === null) continue;
      if (tip.tourPath) {
        if (!tip.tourNeeds || !exists(tip.tourNeeds)) continue;
      } else if (!exists(tip.id)) {
        continue;
      }
      const path = tip.tourPath;
      steps.push({
        id: tip.id,
        target: tipSelector(tip.id),
        title: t(`items.${tip.id}.title`),
        content: t(`items.${tip.id}.body`),
        placement: tip.placement,
        skipBeacon: true,
        // The sidebar is position: fixed. Measured as part of the scrolling page,
        // its spotlight drifted away from the item as soon as the page had scrolled.
        isFixed: tip.placement === "right",
        // Every target is at the top of its screen, so the tour never scrolls: it
        // goes to the top itself. When Joyride scrolled, it measured the spotlight
        // against an overlay that was still `fixed` from the sidebar step, and
        // the cutout landed a page-scroll above the element until the page was
        // scrolled back up.
        skipScroll: true,
        before: async () => {
          window.scrollTo(0, 0);
          if (path && pathnameRef.current !== path) router.push(path);
          await waitForElement(tipSelector(tip.id));
        },
      });
    }
    if (steps.length) setTourSteps(steps);
  }, [router, t]);

  const finishTour = useCallback(() => {
    // Offered once is enough: whatever the tour covered is not shown again.
    persist((tourSteps ?? []).map((step) => String(step.id)));
    setTourSteps(null);
  }, [persist, tourSteps]);

  const replay = useCallback(() => {
    setSeen(new Set());
    void saveTipsAction({ reset: true });
  }, []);

  const onTourEvent = useCallback(
    (data: EventData, controls: { next: () => void }) => {
      if (data.type === EVENTS.TARGET_NOT_FOUND) controls.next();
      if (data.type === EVENTS.TOUR_END) finishTour();
    },
    [finishTour],
  );

  const value = useMemo<TipsContextValue>(
    () => ({
      enabled,
      // Only what the tour covers: the order tip has no page it can open.
      unseen: TIPS.filter(
        (tip) => tip.tourPath !== null && available.includes(tip.id) && !seen.has(tip.id),
      ).length,
      anySeen: seen.size > 0,
      seenCount: available.filter((id) => seen.has(id)).length,
      total: available.length,
      tourRunning,
      startTour,
      replay,
    }),
    [enabled, seen, available, tourRunning, startTour, replay],
  );

  const hotspots = enabled && !tourRunning ? present.filter((id) => !seen.has(id)) : [];
  const hotspotKey = hotspots.join(",");

  // Each unseen tip makes its element glow. Hovering or focusing it opens the
  // tip; using the element (a click) counts as seen, since that is the lesson.
  useEffect(() => {
    const cleanups = hotspots.map((id, index) => {
      const element = document.querySelector(tipSelector(id));
      if (!element) return () => {};
      let timer: number | undefined;
      const open = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => setOpenId(id), 200);
      };
      const cancel = () => window.clearTimeout(timer);
      const used = () => {
        cancel();
        setOpenId(null);
        persist([id]);
      };
      (element as HTMLElement).style.setProperty("--tip-delay", `${index * 0.6}s`);
      element.setAttribute("data-tip-glow", "");
      element.addEventListener("pointerenter", open);
      element.addEventListener("pointerleave", cancel);
      element.addEventListener("focus", open);
      element.addEventListener("click", used);
      return () => {
        cancel();
        element.removeAttribute("data-tip-glow");
        (element as HTMLElement).style.removeProperty("--tip-delay");
        element.removeEventListener("pointerenter", open);
        element.removeEventListener("pointerleave", cancel);
        element.removeEventListener("focus", open);
        element.removeEventListener("click", used);
      };
    });
    return () => cleanups.forEach((cleanup) => cleanup());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotspotKey, persist]);

  // An open tip closes on Escape or a click anywhere else, and stays unseen.
  useEffect(() => {
    if (!openId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenId(null);
    };
    const onPointer = (event: PointerEvent) => {
      const node = event.target as Node;
      const inCard = document.getElementById("react-joyride-portal")?.contains(node);
      const onElement = document.querySelector(tipSelector(openId))?.contains(node);
      if (!inCard && !onElement) setOpenId(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [openId]);

  return (
    <TipsContext.Provider value={value}>
      {children}

      {openId && !tourRunning && !seen.has(openId) && (
        <Joyride
          key={openId}
          run
          steps={[
            {
              id: openId,
              target: tipSelector(openId),
              title: t(`items.${openId}.title`),
              content: t(`items.${openId}.body`),
              placement: TIPS.find((tip) => tip.id === openId)!.placement,
              skipBeacon: true,
            },
          ]}
          options={{
            ...OPTIONS,
            hideOverlay: true,
            buttons: ["primary"],
            overlayClickAction: false,
            skipScroll: true,
          }}
          tooltipComponent={HotspotCard}
          locale={{ last: t("gotIt"), close: t("gotIt") }}
          onEvent={(data) => {
            if (data.type === EVENTS.TOUR_END) {
              persist([openId]);
              setOpenId(null);
            }
          }}
        />
      )}

      {tourSteps && (
        <Joyride
          run
          continuous
          steps={tourSteps}
          options={{
            ...OPTIONS,
            showProgress: true,
            arrowColor: "#161616",
            buttons: ["back", "skip", "primary"],
            overlayClickAction: false,
            targetWaitTimeout: 6000,
          }}
          tooltipComponent={TourCard}
          locale={{
            back: t("back"),
            next: t("next"),
            last: t("done"),
            skip: t("skip"),
            nextWithProgress: t.raw("nextWithProgress") as string,
            close: t("close"),
            open: t("open"),
          }}
          onEvent={onTourEvent}
        />
      )}
    </TipsContext.Provider>
  );
}
