"use client";

import { useEffect } from "react";

export interface DeferredScript {
  id: string;
  /** External script address. */
  src?: string;
  /** Inline code, run after `src` has loaded if both are given. */
  code?: string;
}

/**
 * Third-party scripts (analytics, chat, heatmaps) load only once the page is
 * usable: on the visitor's first interaction, or a few seconds after the page
 * has loaded, whichever comes first. They no longer compete with the page's own
 * scripts for the main thread while it is becoming interactive.
 */
const FALLBACK_DELAY_MS = 4000;

function inject({ id, src, code }: DeferredScript) {
  if (document.getElementById(id)) return;
  const el = document.createElement("script");
  el.id = id;
  if (src) {
    el.src = src;
    el.async = true;
    if (code) el.onload = () => run(`${id}-init`, code);
  } else if (code) {
    el.text = code;
  }
  document.head.appendChild(el);
}

function run(id: string, code: string) {
  if (document.getElementById(id)) return;
  const el = document.createElement("script");
  el.id = id;
  el.text = code;
  document.head.appendChild(el);
}

export default function DeferredScripts({ scripts }: { scripts: DeferredScript[] }) {
  useEffect(() => {
    let done = false;
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    let timer: number | undefined;

    const start = () => {
      if (done) return;
      done = true;
      events.forEach((e) => window.removeEventListener(e, start));
      window.clearTimeout(timer);
      scripts.forEach(inject);
    };

    events.forEach((e) => window.addEventListener(e, start, { once: true, passive: true }));

    const arm = () => {
      timer = window.setTimeout(() => {
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(start, { timeout: 2000 });
        } else {
          start();
        }
      }, FALLBACK_DELAY_MS);
    };
    if (document.readyState === "complete") arm();
    else window.addEventListener("load", arm, { once: true });

    return () => {
      events.forEach((e) => window.removeEventListener(e, start));
      window.removeEventListener("load", arm);
      window.clearTimeout(timer);
    };
    // The list is built on the server and never changes for a mounted layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
