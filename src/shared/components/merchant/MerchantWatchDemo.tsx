"use client";

import { useState } from "react";
import { X, Play } from "lucide-react";

/** Opens the full 25 s narrated promo cut (with music) in a lightbox. */
export default function MerchantWatchDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-[14.5px] font-medium text-white/90 transition hover:text-white"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
          <Play className="h-3.5 w-3.5 translate-x-px fill-current" />
        </span>
        Watch the full video
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 sm:p-8"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="h-5 w-5" />
            </button>
            <video
              src="/merchant-video/suliko_promo_16x9.mp4"
              controls
              autoPlay
              playsInline
              className="aspect-video w-full"
            />
          </div>
        </div>
      )}
    </>
  );
}
