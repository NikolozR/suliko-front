"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";
import NotaryPriceCalculator from "./NotaryPriceCalculator";
import NotaryOrderWizard from "./order/NotaryOrderWizard";
import { isRealClick, trackCta, triggerHotjarEvent } from "@/shared/utils/notaryTracking";

type Tab = "calculator" | "order";

/**
 * The tabbed panel at `#calculator` — handoff §4.
 *
 * Tab 1 quotes instantly and captures no lead. Tab 2 is the real conversion.
 */
export default function NotaryTabbedCalculator() {
  const t = useTranslations("NotaryPage.calculator.tabs");
  const [activeTab, setActiveTab] = useState<Tab>("order");

  useEffect(() => {
    triggerHotjarEvent("calculator_view");
  }, []);

  /**
   * `order_start` is intent, not a lead — and the hero's synthetic click must
   * not count as a second one, hence the `isTrusted` check.
   */
  const selectTab = (tab: Tab, event?: React.MouseEvent) => {
    setActiveTab(tab);
    if (tab === "order" && isRealClick(event?.nativeEvent)) {
      trackCta("order_start", "tab");
    }
  };

  const tabClass = (tab: Tab) =>
    `flex-1 px-3 py-3 sm:px-4 sm:py-4 text-sm sm:text-base font-semibold transition-all duration-300 ${
      activeTab === tab
        ? "border-b-2 border-suliko-default-color text-suliko-default-color bg-card"
        : "text-muted-foreground hover:text-suliko-default-color hover:bg-card/50"
    }`;

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Tab bar */}
      <div className="flex border-b border-border bg-muted/40">
        <button
          type="button"
          data-tab="calculator"
          onClick={(e) => selectTab("calculator", e)}
          className={tabClass("calculator")}
        >
          <span className="flex items-center justify-center gap-1.5 sm:gap-2">
            <Calculator className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            <span className="truncate">{t("calculator")}</span>
          </span>
        </button>
        <button
          type="button"
          data-tab="order"
          onClick={(e) => selectTab("order", e)}
          className={tabClass("order")}
        >
          <span className="flex items-center justify-center gap-1.5 sm:gap-2">
            <ClipboardList className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            <span className="truncate">{t("order")}</span>
          </span>
        </button>
      </div>

      {/*
        Keyed enter-only animation, no AnimatePresence `exit`: with `mode="wait"`
        the outgoing tab must finish exiting before the incoming one mounts, and
        an exit that never settles leaves the panel stuck on the old tab.
      */}
      <div className="px-3 py-4 sm:px-5 sm:py-6 md:px-6 md:py-8">
        <div>
          {activeTab === "calculator" ? (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-5 text-center">
                <h3 className="text-xl font-bold text-foreground sm:text-2xl">
                  {t("calcTitle")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("calcSub")}</p>
              </div>
              <NotaryPriceCalculator />
            </motion.div>
          ) : (
            <motion.div
              key="order"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* No heading here: the wizard renders its own full-bleed step
                  header, which would collide with one stacked above it. */}
              <NotaryOrderWizard />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
