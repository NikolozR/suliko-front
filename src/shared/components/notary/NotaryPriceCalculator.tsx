"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, X, Clock, Mail, Phone, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { languageTranslations, languages, languagePrices, type Language } from "@/shared/utils/notaryHelpers";
import { NOTARY_PHONE } from "@/shared/constants/notary";

const PRICE_BREAKS = {
  LARGE_ORDER: 100,
  MEDIUM_ORDER: 50,
  DISCOUNT_LARGE: 0.15,
  DISCOUNT_MEDIUM: 0.10,
} as const;

type DocItem = {
  id: number;
  fromLang: Language;
  toLang: Language;
  pageCount: number;
  notaryApproval: boolean;
};

type DocResult = {
  id: number;
  number: number;
  pageCount: number;
  translationCost: number;
  discount: number;
  notaryCost: number;
  subtotal: number;
};

export default function NotaryPriceCalculator() {
  const t = useTranslations("NotaryPage.calculator.priceCalc");
  const locale = useLocale();

  const [isOpen, setIsOpen] = useState(false);
  const [documents, setDocuments] = useState<DocItem[]>([
    { id: 1, fromLang: "english", toLang: "georgian", pageCount: 1, notaryApproval: false },
  ]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [deliveryTime, setDeliveryTime] = useState("");
  const [breakdown, setBreakdown] = useState<DocResult[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const displayNames = languageTranslations[locale] ?? languageTranslations.en;

  const calculateDeliveryTime = (totalPages: number) => {
    if (totalPages <= 10) return t("delivery90");
    if (totalPages <= 40) return t("delivery180");
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

  const getLanguagePairPrice = (from: Language, to: Language) => {
    if (from === "georgian") return languagePrices[to];
    if (to === "georgian") return languagePrices[from];
    return Math.max(languagePrices[from], languagePrices[to]);
  };

  const calculateTranslationPrice = (basePrice: number, pages: number) => {
    const cost = basePrice * pages;
    let discount = 0;
    if (pages >= PRICE_BREAKS.LARGE_ORDER) discount = cost * PRICE_BREAKS.DISCOUNT_LARGE;
    else if (pages >= PRICE_BREAKS.MEDIUM_ORDER) discount = cost * PRICE_BREAKS.DISCOUNT_MEDIUM;
    return { translationCost: cost - discount, discount };
  };

  const addDocument = () => {
    const newId = Math.max(...documents.map((d) => d.id)) + 1;
    const first = documents[0];
    setDocuments([
      ...documents,
      { id: newId, fromLang: first.fromLang, toLang: first.toLang, pageCount: 1, notaryApproval: first.notaryApproval },
    ]);
  };

  const removeDocument = (id: number) => {
    if (documents.length > 1) setDocuments(documents.filter((d) => d.id !== id));
  };

  const updateDoc = (id: number, patch: Partial<DocItem>) => {
    setDocuments(documents.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const calculatePrice = (e: React.FormEvent) => {
    e.preventDefault();
    const results: DocResult[] = [];
    let grand = 0;
    let totalPages = 0;

    documents.forEach((doc, index) => {
      const basePrice = getLanguagePairPrice(doc.fromLang, doc.toLang);
      const { translationCost, discount } = calculateTranslationPrice(basePrice, doc.pageCount);
      const notaryCost = doc.notaryApproval ? calculateNotaryPrice(doc.pageCount) : 0;
      const subtotal = translationCost + notaryCost;
      grand += subtotal;
      totalPages += doc.pageCount;
      results.push({ id: doc.id, number: index + 1, pageCount: doc.pageCount, translationCost, discount, notaryCost, subtotal });
    });

    setBreakdown(results);
    setTotalPrice(grand);
    setDeliveryTime(calculateDeliveryTime(totalPages));
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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-8">
      <form onSubmit={calculatePrice} className="space-y-4">

        {/* Document cards */}
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <div
              key={doc.id}
              className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 space-y-4"
            >
              {/* Card header */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {t("document")} #{index + 1}
                </span>
                {documents.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDocument(doc.id)}
                    className="flex items-center text-red-500 hover:text-red-700 transition-colors text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    {t("removeDocument")}
                  </button>
                )}
              </div>

              {/* Language selects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(
                  [
                    { label: t("sourceLanguage"), value: doc.fromLang, key: "fromLang" as const },
                    { label: t("targetLanguage"), value: doc.toLang, key: "toLang" as const },
                  ] as const
                ).map(({ label, value, key }) => (
                  <div key={key} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400">{label}</label>
                    <div className="relative">
                      <select
                        value={value}
                        onChange={(e) => updateDoc(doc.id, { [key]: e.target.value as Language })}
                        style={{ backgroundImage: "none" }}
                        className="w-full appearance-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors text-sm"
                      >
                        {languages.map((lang) => (
                          <option key={lang} value={lang}>
                            {displayNames[lang] ?? lang}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Page count */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400">{t("pageCount")}</label>
                <input
                  type="number"
                  min="1"
                  value={doc.pageCount}
                  onChange={(e) => updateDoc(doc.id, { pageCount: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors text-sm"
                />
              </div>

              {/* Notary checkbox */}
              <div
                onClick={() => updateDoc(doc.id, { notaryApproval: !doc.notaryApproval })}
                className="flex items-center bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-600 hover:border-blue-200 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={doc.notaryApproval}
                  onChange={(e) => updateDoc(doc.id, { notaryApproval: e.target.checked })}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label className="ml-2 text-gray-700 dark:text-slate-300 cursor-pointer select-none text-sm">
                  {t("notaryApproval")}
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Add Document button */}
        <button
          type="button"
          onClick={addDocument}
          className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl text-gray-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">{t("addDocument")}</span>
        </button>

        {/* Calculate button */}
        <button
          type="submit"
          className="w-full bg-linear-to-r from-blue-500 to-indigo-500 text-white py-4 px-6 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-3 font-medium shadow-lg"
        >
          <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">{t("calculate")}</span>
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
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Header */}
              <div className="flex justify-between items-center px-4 py-4 sm:p-6 border-b border-gray-200 dark:border-slate-700 shrink-0">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t("translationDetails")}</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">

                {/* Per-document breakdown */}
                {breakdown.map((doc) => (
                  <div key={doc.id} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-700 pb-2">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        {t("document")} #{doc.number} &mdash; {doc.pageCount} {t("pageCount").toLowerCase()}
                      </span>
                      <span className="font-bold text-blue-600 text-sm">{doc.subtotal.toFixed(2)} ₾</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-slate-400">{t("translationCost")}</span>
                        <span className="dark:text-white">{doc.translationCost.toFixed(2)} ₾</span>
                      </div>
                      {doc.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>{t("discount")}</span>
                          <span>-{doc.discount.toFixed(2)} ₾</span>
                        </div>
                      )}
                      {doc.notaryCost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-slate-400">{t("notaryCost")}</span>
                          <span className="dark:text-white">{doc.notaryCost.toFixed(2)} ₾</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Grand total */}
                <div className="flex justify-between text-xl font-bold text-blue-600 pt-2 border-t border-gray-200 dark:border-slate-700">
                  <span>{t("totalPrice")}</span>
                  <span>{totalPrice.toFixed(2)} ₾</span>
                </div>

                {/* Delivery time */}
                <div className="flex items-center text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl">
                  <Clock className="w-5 h-5 mr-2 shrink-0" />
                  <span>{deliveryTime}</span>
                </div>

                {/* CTA buttons */}
                <div className="grid gap-4">
                  <button
                    onClick={() => copyToClipboard("info@th.com.ge")}
                    className="w-full bg-linear-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all flex items-center justify-center space-x-3"
                  >
                    <Mail className="w-5 h-5" />
                    <span>{t("copyEmail")}</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(NOTARY_PHONE)}
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
