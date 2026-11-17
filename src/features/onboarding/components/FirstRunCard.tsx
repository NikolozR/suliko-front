"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Briefcase, CreditCard, FileText, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { useAuthStore } from "@/features/auth/store/authStore";
import { Link } from "@/i18n/navigation";
import { OFFICE_URL, officeLocale } from "@/features/sulikoOffice/lib/officeLinks";

const DISMISSED_KEY = "suliko:first-run-card-dismissed";

const OfficePresence = createContext(false);

/** Set in the (main) layout from what the server saw: is this person signed in to Office? */
export function OfficePresenceProvider({ hasOffice, children }: { hasOffice: boolean; children: ReactNode }) {
  return <OfficePresence.Provider value={hasOffice}>{children}</OfficePresence.Provider>;
}

/** Is this person signed in to Office? (False outside the (main) layout.) */
export function useHasOffice(): boolean {
  return useContext(OfficePresence);
}

/**
 * What to do first, on the New translation page, for someone who has not
 * opened Suliko Office yet: translate a document, top up, try Office. It can
 * be closed and then stays closed (kept in this browser). Someone already in
 * Office, or not signed in, does not see it.
 */
export function FirstRunCard() {
  const t = useTranslations("FirstRun");
  const locale = useLocale();
  const token = useAuthStore((s) => s.token);
  const hasOffice = useContext(OfficePresence);
  // Unknown until the browser has been asked, so the card never flashes in and out.
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISSED_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!token || hasOffice || dismissed !== false) return null;

  const close = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Not kept: it will be offered again next time.
    }
  };

  const steps = [
    { key: "translate", icon: FileText, label: t("translate"), hint: t("translateHint"), href: "/document" },
    { key: "topUp", icon: CreditCard, label: t("topUp"), hint: t("topUpHint"), href: "/profile#billing" },
  ];

  return (
    <section aria-labelledby="first-run-title" className="border-border bg-card relative mb-6 rounded-xl border p-4 shadow-sm md:p-5">
      <button
        type="button"
        onClick={close}
        aria-label={t("close")}
        className="text-muted-foreground hover:text-foreground absolute top-3 right-3 inline-flex size-8 cursor-pointer items-center justify-center rounded-md pointer-coarse:size-11"
      >
        <X className="size-4" aria-hidden />
      </button>
      <h2 id="first-run-title" className="pr-10 text-base font-semibold">
        {t("title")}
      </h2>
      <p className="text-muted-foreground mt-1 pr-10 text-sm">{t("subtitle")}</p>

      <ul className="mt-4 grid gap-3 md:grid-cols-3">
        {steps.map(({ key, icon: Icon, label, hint, href }) => (
          <li key={key}>
            <Link href={href} className="border-border hover:bg-accent flex h-full items-start gap-3 rounded-lg border p-3">
              <Icon className="text-suliko-default-color mt-0.5 size-5 shrink-0" aria-hidden />
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="text-muted-foreground block text-xs">{hint}</span>
              </span>
            </Link>
          </li>
        ))}
        <li>
          <a
            href={`${OFFICE_URL}/${officeLocale(locale)}/dashboard`}
            className="border-border hover:bg-accent flex h-full items-start gap-3 rounded-lg border p-3"
          >
            <Briefcase className="text-suliko-default-color mt-0.5 size-5 shrink-0" aria-hidden />
            <span>
              <span className="block text-sm font-medium">{t("office")}</span>
              <span className="text-muted-foreground block text-xs">{t("officeHint")}</span>
            </span>
          </a>
        </li>
      </ul>
    </section>
  );
}
