"use client";

import { Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

// Centered pop-up shown on the sign-in page while the backend is down.
// Remove its use in sign-in/page.tsx once the API is back.
export default function MaintenanceBanner() {
  const t = useTranslations("Maintenance");
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="maintenance-title"
        className="w-full max-w-md rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center text-amber-950 shadow-2xl"
      >
        <Wrench className="mx-auto mb-3 size-8" aria-hidden />
        <h2 id="maintenance-title" className="text-lg font-semibold">
          {t("title")}
        </h2>
        <p className="mt-2 text-sm">{t("body")}</p>
        <button
          type="button"
          autoFocus
          onClick={() => setOpen(false)}
          className="mt-5 rounded-lg bg-amber-900 px-5 py-2 text-sm font-medium text-white hover:bg-amber-800"
        >
          OK
        </button>
      </div>
    </div>
  );
}
