"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    $crisp: unknown[];
  }
}

export default function CrispChatButton() {
  // Hide the default Crisp launcher while this button is mounted (sign-in page).
  // Restore it when navigating away so other pages still get the default bubble.
  useEffect(() => {
    const hide = () => {
      if (typeof window !== "undefined" && window.$crisp) {
        window.$crisp.push(["do", "chat:hide"]);
      }
    };

    // Crisp loads async — try immediately and once more after it finishes loading.
    hide();
    const timer = setTimeout(hide, 1500);

    return () => {
      clearTimeout(timer);
      if (typeof window !== "undefined" && window.$crisp) {
        window.$crisp.push(["do", "chat:show"]);
      }
    };
  }, []);

  const openChat = () => {
    if (typeof window !== "undefined" && window.$crisp) {
      window.$crisp.push(["do", "chat:open"]);
    }
  };

  return (
    <button
      type="button"
      onClick={openChat}
      aria-label="Open support chat"
      className="
        fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]
        flex items-center gap-2.5
        px-4 py-2.5 rounded-full
        backdrop-blur-xl backdrop-saturate-150
        bg-white/70 dark:bg-white/[0.09]
        border border-white/60 dark:border-white/[0.15]
        shadow-lg dark:shadow-black/40
        text-sm font-medium text-foreground
        hover:bg-white/90 dark:hover:bg-white/[0.14]
        transition-all duration-200 hover:scale-105 active:scale-95
        cursor-pointer select-none
      "
    >
      {/* Chat bubble icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="shrink-0 text-suliko-default-color"
        aria-hidden="true"
      >
        <path
          d="M8 1C4.134 1 1 3.91 1 7.5c0 1.52.57 2.92 1.52 4.02L1.5 14l2.72-1.07A7.1 7.1 0 0 0 8 14c3.866 0 7-2.91 7-6.5S11.866 1 8 1z"
          fill="currentColor"
          opacity=".18"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <circle cx="5.5" cy="7.5" r="0.9" fill="currentColor" />
        <circle cx="8" cy="7.5" r="0.9" fill="currentColor" />
        <circle cx="10.5" cy="7.5" r="0.9" fill="currentColor" />
      </svg>
      <span className="text-foreground/80">Need help?</span>
    </button>
  );
}
