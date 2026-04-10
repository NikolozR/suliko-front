"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, X, Clock, Mail, Phone, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { languageTranslations, languages, languagePrices, type Language } from "@/shared/utils/notaryHelpers";

const PRICE_BREAKS = {
  LARGE_ORDER: 100,
  MEDIUM_ORDER: 50,
  DISCOUNT_LARGE: 0.15,
  DISCOUNT_MEDIUM: 0.10,
} as const;

export default function NotaryPriceCalculator() {
  const t = useTranslations("NotaryPage.calculator.priceCalc");
  const locale = useLocale();

  const [isOpen, setIsOpen] = useState(false);
  const [fromLang, setFromLang] = useState<Language>("english");
  const [toLang, setToLang] = useState<Language>("georgian");
  const [pageCount, setPageCount] = useState(1);
  const [notaryApproval, setNotaryApproval] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  // const [translationPrice, setTranslationPrice] = useState(0);
  const [notaryPrice, setNotaryPrice] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [deliveryTime, setDeliveryTime] = useState("");
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const displayNames = languageTranslations[locale] ?? languageTranslations.en;

  const calculateDeliveryTime = (pages: number) => {
    if (pages <= 10) return t("delivery90");
    if (pages <= 40) return t("delivery180");
    return t("deliveryCustom");
  };

  const calculateNotaryPrice = (pages: number) => {
    let pricePerPage: number;
    if (pages === 1) pricePerPage = 6;
    else if (pages <= 10) pricePerPage = 4;
    else if (pages <= 50) pricePerPage = 3;
    else pricePerPage = 2;
    return pricePerPage * pages * 1.18 + 5;
  };

  const calculateTranslationPrice = (basePrice: number, pages: number) => {
    const cost = basePrice * pages;
    let discount = 0;
    if (pages >= PRICE_BREAKS.LARGE_ORDER) discount = cost * PRICE_BREAKS.DISCOUNT_LARGE;
    else if (pages >= PRICE_BREAKS.MEDIUM_ORDER) discount = cost * PRICE_BREAKS.DISCOUNT_MEDIUM;
    return { translationCost: cost - discount, discount };
  };

  const getLanguagePairPrice = (from: Language, to: Language) => {
    if (from === "georgian") return languagePrices[to];
    if (to === "georgian") return languagePrices[from];
    return Math.max(languagePrices[from], languagePrices[to]);
  };

  const calculatePrice = (e: React.FormEvent) => {
    e.preventDefault();
    const basePrice = getLanguagePairPrice(fromLang, toLang);
    const { translationCost, discount } = calculateTranslationPrice(basePrice, pageCount);
    const notaryCost = notaryApproval ? calculateNotaryPrice(pageCount) : 0;
    // setTranslationPrice(translationCost);
    setNotaryPrice(notaryCost);
    setDiscountAmount(discount);
    setTotalPrice(translationCost + notaryCost);
    setDeliveryTime(calculateDeliveryTime(pageCount));
    setIsOpen(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.touches[0].clientY);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    if (touchStart - touchEnd < -100) setIsOpen(false);
    setTouchStart(null);
    setTouchEnd(null);
  };

  const langSelects = [
    { label: t("sourceLanguage"), value: fromLang, setter: setFromLang },
    { label: t("targetLanguage"), value: toLang, setter: setToLang },
  ] as const;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-4 md:p-6 lg:p-8">
      <form onSubmit={calculatePrice} className="space-y-6">

        {/* Language selects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {langSelects.map(({ label, value, setter }) => (
            <div key={label} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
              <div className="relative">
                <select
                  value={value}
                  onChange={(e) => setter(e.target.value as Language)}
                  style={{ backgroundImage: "none" }}
                  className="w-full appearance-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {displayNames[lang] ?? lang}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          ))}
        </div>

        {/* Page count */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t("pageCount")}</label>
          <input
            type="number"
            min="1"
            value={pageCount}
            onChange={(e) => setPageCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
          />
        </div>

        {/* Notary checkbox */}
        <div
          onClick={() => setNotaryApproval((v) => !v)}
          className="flex items-center bg-white dark:bg-slate-800 p-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 hover:border-blue-200 transition-colors cursor-pointer"
        >
          <input
            type="checkbox"
            checked={notaryApproval}
            onChange={(e) => setNotaryApproval(e.target.checked)}
            className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          />
          <label className="ml-3 text-gray-700 dark:text-slate-300 cursor-pointer select-none">{t("notaryApproval")}</label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 px-6 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-3 font-medium shadow-lg"
        >
          <Calculator className="w-5 h-5" />
          <span>{t("calculate")}</span>
        </button>
      </form>

      {/* Results modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t("translationDetails")}</h3>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-slate-400">{t("pricePerPage")}</span>
                    <span className="font-medium dark:text-white">{getLanguagePairPrice(fromLang, toLang)} ₾</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{t("discount")}</span>
                      <span>-{discountAmount.toFixed(2)} ₾</span>
                    </div>
                  )}
                  {notaryApproval && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-slate-400">{t("notaryCost")}</span>
                      <span className="font-medium dark:text-white">{notaryPrice.toFixed(2)} ₾</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-blue-600 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <span>{t("totalPrice")}</span>
                    <span>{totalPrice.toFixed(2)} ₾</span>
                  </div>
                </div>

                {/* Delivery time */}
                <div className="flex items-center text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                  <Clock className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span>{deliveryTime}</span>
                </div>

                {/* CTA buttons */}
                <div className="grid gap-4">
                  <button
                    onClick={() => copyToClipboard("info@th.com.ge")}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all flex items-center justify-center space-x-3"
                  >
                    <Mail className="w-5 h-5" />
                    <span>{t("copyEmail")}</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard("+995591729911")}
                    className="w-full bg-green-600 text-white py-4 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center space-x-3"
                  >
                    <Phone className="w-5 h-5" />
                    <span>{t("copyPhone")}</span>
                  </button>
                </div>

                <div className="md:hidden text-center text-sm text-gray-500">{t("swipeDown")}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
