"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import NotaryPriceCalculator from "./NotaryPriceCalculator";
import NotaryFileUploadForm from "./NotaryFileUploadForm";

type Tab = "calculator" | "upload";

export default function NotaryTabbedCalculator() {
  const t = useTranslations("NotaryPage.calculator.tabs");
  const [activeTab, setActiveTab] = useState<Tab>("calculator");

  const tabClass = (tab: Tab) =>
    `flex-1 px-4 py-3 sm:py-4 font-semibold text-sm sm:text-base transition-all duration-300 ${
      activeTab === tab
        ? "border-b-2 border-blue-500 text-blue-600 bg-white dark:bg-slate-900"
        : "text-gray-500 hover:text-blue-600 hover:bg-white/50 dark:hover:bg-slate-800/50"
    }`;

  return (
    <motion.div
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-blue-100 dark:border-slate-800 overflow-hidden relative"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800">
        <button onClick={() => setActiveTab("calculator")} className={tabClass("calculator")}>
          <div className="flex items-center justify-center space-x-2">
            <Calculator className="w-5 h-5" />
            <span>{t("calculator")}</span>
          </div>
        </button>
        <button onClick={() => setActiveTab("upload")} className={tabClass("upload")}>
          <div className="flex items-center justify-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>{t("upload")}</span>
          </div>
        </button>
      </div>

      {/* Tab content */}
      <div className="p-4 sm:p-6 md:p-8">
        <AnimatePresence mode="wait">
          {activeTab === "calculator" && (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl sm:text-2xl font-bold text-blue-600 mb-5 text-center">
                {t("calcTitle")}
              </h3>
              <NotaryPriceCalculator />
            </motion.div>
          )}

          {activeTab === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-blue-600 mb-2">
                  {t("uploadTitle")}
                </h3>
                <p className="text-blue-600 font-medium">
                  ⚡ {t("uploadSub")}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-xl p-4 md:p-6 border border-blue-100 dark:border-slate-700">
                <NotaryFileUploadForm />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
