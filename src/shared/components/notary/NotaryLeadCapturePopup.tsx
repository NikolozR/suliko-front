"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, MessageCircle, Phone, Mail, PhoneCall, CheckCircle, Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Dialog, DialogContent } from "@/features/ui/components/ui/dialog";
import { languageTranslations, type Language } from "@/shared/utils/notaryHelpers";
import { NOTARY_PHONE, NOTARY_WHATSAPP } from "@/shared/constants/notary";

type Step = 1 | 2 | 3 | 4;
type ContactMethod = "whatsapp" | "call" | "email" | "callback";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TOTAL_STEPS = 4;

export default function NotaryLeadCapturePopup({ isOpen, onClose }: Props) {
  const t = useTranslations("NotaryPage.survey");
  const locale = useLocale();

  const [step, setStep] = useState<Step>(1);
  const [fromLang, setFromLang] = useState<Language>("english");
  const [toLang, setToLang] = useState<Language>("georgian");
  const [notary, setNotary] = useState<boolean | null>(null);
  const [contactMethod, setContactMethod] = useState<ContactMethod | null>(null);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const displayNames = languageTranslations[locale] ?? languageTranslations.en;

  const POPULAR_LANGUAGES: Language[] = [
    "english",
    "russian",
    "german",
    "georgian",
    "french",
    "spanish",
    "turkish",
    "azerbaijani",
    "arabic",
    "chinese",
    "japanese",
    "korean",
  ];
  const resetAndClose = () => {
    onClose();
    // Reset after modal closes
    setTimeout(() => {
      setStep(1);
      setFromLang("english");
      setToLang("georgian");
      setNotary(null);
      setContactMethod(null);
      setPhone("");
      setSubmitting(false);
      setSubmitted(false);
      setError(false);
    }, 300);
  };

  const goNext = () => {
    if (step < TOTAL_STEPS) setStep((s) => (s + 1) as Step);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const handleContactSelect = async (method: ContactMethod) => {
    setContactMethod(method);

    if (method === "whatsapp") {
      const msg = encodeURIComponent(
        `Hi! I need a ${notary ? "certified " : ""}translation from ${displayNames[fromLang]} to ${displayNames[toLang]}.`
      );
      window.open(`https://wa.me/${NOTARY_WHATSAPP}?text=${msg}`, "_blank");
      resetAndClose();
      return;
    }
    if (method === "call") {
      window.open(`tel:${NOTARY_PHONE}`, "_self");
      resetAndClose();
      return;
    }
    if (method === "email") {
      const subject = encodeURIComponent(`Translation Request: ${displayNames[fromLang]} → ${displayNames[toLang]}`);
      const body = encodeURIComponent(`Hello,\n\nI need a ${notary ? "certified " : ""}translation from ${displayNames[fromLang]} to ${displayNames[toLang]}.\n\nPlease send me a quote.\n\nThank you.`);
      window.open(`mailto:info@th.com.ge?subject=${subject}&body=${body}`, "_self");
      resetAndClose();
      return;
    }
    // callback — stay on step 4, show phone input
  };

  const handleCallbackSubmit = async () => {
    if (!phone.trim()) return;
    setSubmitting(true);
    setError(false);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "callback@suliko.ge",
          subject: `Callback Request — ${displayNames[fromLang]} → ${displayNames[toLang]}${notary ? " (Notary)" : ""}`,
          message: `Phone: ${phone}\nFrom: ${displayNames[fromLang]}\nTo: ${displayNames[toLang]}\nNotary: ${notary ? "Yes" : "No"}`,
        }),
      });

      if (!res.ok) throw new Error("failed");
      setSubmitted(true);
      setTimeout(() => resetAndClose(), 2500);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-sm mx-auto p-0 overflow-y-auto max-h-[90vh] border-border gap-0 [&>button]:hidden">
        {/* Header */}
        <div className="bg-linear-to-br from-suliko-default-color to-indigo-600 px-5 pt-5 pb-4 text-white">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-xs font-medium bg-white/20 rounded-full px-2 py-0.5">
                {t("priceBadge")}
              </span>
              <h2 className="text-base font-bold mt-2 leading-snug">{t("title")}</h2>
              <p className="text-xs text-blue-100 mt-0.5">{t("subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={resetAndClose}
              className="shrink-0 ml-2 text-white/70 hover:text-white transition-colors"
              aria-label={t("close")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-right text-[11px] text-blue-100 mt-1">
            {t('stepOf', { current: step, total: TOTAL_STEPS })}
          </p>
        </div>

        {/* Step body */}
        <div className="px-5 py-5 min-h-[220px] flex flex-col">
          <AnimatePresence mode="wait">
            {/* STEP 1 — Source language */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col"
              >
                <h3 className="text-sm font-semibold text-foreground mb-3">{t("step1heading")}</h3>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setFromLang(lang)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 ${fromLang === lang
                        ? "bg-suliko-default-color text-white border-suliko-default-color"
                        : "border-border text-foreground hover:border-suliko-default-color hover:text-suliko-default-color"
                        }`}
                    >
                      {displayNames[lang]}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2 — Target language */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col"
              >
                <h3 className="text-sm font-semibold text-foreground mb-3">{t("step2heading")}</h3>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_LANGUAGES.map((lang) => (
                    lang !== fromLang &&
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setToLang(lang)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 ${toLang === lang
                        ? "bg-suliko-default-color text-white border-suliko-default-color"
                        : "border-border text-foreground hover:border-suliko-default-color hover:text-suliko-default-color"
                        }`}
                    >
                      {displayNames[lang]}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3 — Notary */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col"
              >
                <h3 className="text-sm font-semibold text-foreground mb-4">{t("step3heading")}</h3>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => { setNotary(true); goNext(); }}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-150 text-left ${notary === true
                      ? "bg-suliko-default-color/10 border-suliko-default-color text-suliko-default-color"
                      : "border-border text-foreground hover:border-suliko-default-color"
                      }`}
                  >
                    <span className="h-8 w-8 rounded-full bg-suliko-default-color/10 flex items-center justify-center text-base shrink-0">✅</span>
                    {t("notaryYes")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNotary(false); goNext(); }}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-150 text-left ${notary === false
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border text-foreground hover:border-primary"
                      }`}
                  >
                    <span className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-base shrink-0">📄</span>
                    {t("notaryNo")}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4 — Contact method */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col"
              >
                {submitted ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-4">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <p className="text-sm font-semibold text-foreground">{t("callbackSuccess")}</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-foreground mb-4">{t("step4heading")}</h3>

                    {/* Summary chip */}
                    <div className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-full px-3 py-1 self-start">
                      <span>{displayNames[fromLang]}</span>
                      <span>→</span>
                      <span>{displayNames[toLang]}</span>
                      {notary && <span className="ml-1 text-suliko-default-color">• Notary</span>}
                    </div>

                    {contactMethod === "callback" ? (
                      /* Callback phone input */
                      <div className="flex flex-col gap-3">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder={t("callbackPhone")}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-suliko-default-color/40"
                        />
                        {error && (
                          <p className="text-xs text-destructive">{t("callbackError")}</p>
                        )}
                        <button
                          type="button"
                          onClick={handleCallbackSubmit}
                          disabled={!phone.trim() || submitting}
                          className="flex items-center justify-center gap-2 rounded-lg bg-suliko-default-color px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-suliko-default-color] transition-colors"
                        >
                          {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <PhoneCall className="h-4 w-4" />
                          )}
                          {t("callbackSend")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setContactMethod(null)}
                          className="text-xs text-muted-foreground hover:text-foreground text-center"
                        >
                          ← {t("back")}
                        </button>
                      </div>
                    ) : (
                      /* Contact method buttons */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleContactSelect("whatsapp")}
                          className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-xs font-medium text-foreground hover:border-[#25D366] hover:bg-[#25D366]/5 transition-all duration-150"
                        >
                          <MessageCircle className="h-5 w-5 text-[#25D366]" />
                          {t("whatsapp")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleContactSelect("call")}
                          className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-xs font-medium text-foreground hover:border-blue-500 hover:bg-blue-500/5 transition-all duration-150"
                        >
                          <Phone className="h-5 w-5 text-blue-500" />
                          {t("call")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleContactSelect("email")}
                          className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-xs font-medium text-foreground hover:border-violet-500 hover:bg-violet-500/5 transition-all duration-150"
                        >
                          <Mail className="h-5 w-5 text-violet-500" />
                          {t("email")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setContactMethod("callback")}
                          className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-xs font-medium text-foreground hover:border-orange-500 hover:bg-orange-500/5 transition-all duration-150"
                        >
                          <PhoneCall className="h-5 w-5 text-orange-500" />
                          {t("callback")}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer nav (steps 1–2 need Next; step 3–4 auto-advance or have their own buttons) */}
        {(step === 1 || step === 2) && (
          <div className="px-5 pb-5 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                {t("back")}
              </button>
            ) : (
              <button
                type="button"
                onClick={resetAndClose}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("skip")}
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-1 rounded-lg bg-suliko-default-color px-4 py-2 text-sm font-semibold text-white hover:bg-suliko-default-color] transition-colors"
            >
              {t("next")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="px-5 pb-5 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("back")}
            </button>
          </div>
        )}

        {step === 4 && !submitted && contactMethod !== "callback" && (
          <div className="px-5 pb-5 flex items-center">
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("back")}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
